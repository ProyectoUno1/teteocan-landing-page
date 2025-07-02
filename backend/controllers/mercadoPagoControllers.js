const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const pool = require('../db');

const preciosFile = path.join(__dirname, '../precios.json');

/**
 * Controlador para crear una suscripción dinámica en Mercado Pago.
 * Recibe en req.body: clienteEmail, orderData, tipoSuscripcion y planId.
 * Valida precios oficiales de plan y extras, crea la suscripción y guarda la orden.
 */
const crearSuscripcionDinamica = async (req, res) => {
    try {
        const { clienteEmail, orderData, tipoSuscripcion, planId } = req.body;

        if (!clienteEmail || !orderData || !orderData.monto || !planId) {
            console.log('Faltan datos obligatorios');
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        // Leer precios oficiales
        const preciosRaw = fs.readFileSync(preciosFile, 'utf-8');
        const precios = JSON.parse(preciosRaw);

        // Validar tipo suscripción
        const tipo = ['mensual', 'anual'].includes(tipoSuscripcion) ? tipoSuscripcion : 'mensual';

        // Validar plan
        const precioOficial = precios[tipo]?.[planId.toLowerCase()];
        if (precioOficial === undefined) {
            return res.status(400).json({ message: `No existe el plan "${planId}" en los precios oficiales (${tipo})` });
        }

        // Validar y sumar extras oficiales
        let extrasFinales = 0;
        if (orderData.extrasSeleccionados && Array.isArray(orderData.extrasSeleccionados)) {
            const extrasPrecios = precios[tipo]?.extras || {};

            const isTitan = planId.toLowerCase() === 'titan';
            const isAnual = tipo === 'anual';
            const extrasGratisTitanAnual = ['logotipo', 'tpv', 'negocios'];

            orderData.extrasSeleccionados.forEach(extraKey => {
                const esGratis = isTitan && isAnual && extrasGratisTitanAnual.includes(extraKey);
                if (!esGratis && extrasPrecios[extraKey]) {
                    extrasFinales += extrasPrecios[extraKey];
                }
            });
        }

        let montoFinal = precioOficial + extrasFinales;

        // Si el monto enviado es mayor (por seguridad), tomar ese
        if (orderData.monto && Number(orderData.monto) > montoFinal) {
            montoFinal = Number(orderData.monto);
        }

        const isSandbox = process.env.NODE_ENV !== 'production';
        const payerEmail = isSandbox ? process.env.MP_PAYER_EMAIL : clienteEmail;

        const preapproval_data = {
            reason: `Suscripción ${orderData.nombrePaquete}`,
            auto_recurring: {
                frequency: 1,
                frequency_type: "months",
                transaction_amount: montoFinal,
                currency_id: "MXN",
                start_date: new Date().toISOString(),
                end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            },
            back_url: "https://tlatec.teteocan.com",
            payer_email: payerEmail,
        };

        // Crear suscripción Mercado Pago
        const response = await fetch('https://api.mercadopago.com/preapproval', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preapproval_data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error en API Mercado Pago:', errorText);
            return res.status(500).json({ message: 'Error en Mercado Pago', error: errorText });
        }

        const data = await response.json();
        const preapprovalId = data.id;

        // Guardar orden en DB
        try {
            await pool.query(`
        INSERT INTO ventas (
          preapproval_id,
          cliente_email,
          nombre_paquete,
          resumen_servicios,
          monto,
          fecha,
          mensaje_continuar,
          tipo_suscripcion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (preapproval_id) DO UPDATE SET
          cliente_email = EXCLUDED.cliente_email,
          nombre_paquete = EXCLUDED.nombre_paquete,
          resumen_servicios = EXCLUDED.resumen_servicios,
          monto = EXCLUDED.monto,
          fecha = EXCLUDED.fecha,
          mensaje_continuar = EXCLUDED.mensaje_continuar,
          tipo_suscripcion = EXCLUDED.tipo_suscripcion;
      `, [
                preapprovalId,
                clienteEmail,
                orderData.nombrePaquete,
                orderData.resumenServicios,
                montoFinal,
                orderData.fecha,
                orderData.mensajeContinuar || 'La empresa se pondrá en contacto contigo para continuar con los siguientes pasos.',
                tipo
            ]);
            console.log(`Orden con preapproval_id ${preapprovalId} guardada en DB`);
        } catch (err) {
            console.error('Error guardando orden en DB:', err);
        }

        res.json({ init_point: data.init_point });

    } catch (error) {
        console.error('Error en crearSuscripcionDinamica:', error);
        res.status(500).json({ message: 'Error al crear suscripción', error: error.message });
    }
};

module.exports = { crearSuscripcionDinamica };
