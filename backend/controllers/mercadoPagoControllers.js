const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const pool = require('../db');

const preciosFile = path.join(__dirname, '../precios.json');

const crearSuscripcionDinamica = async (req, res) => {
    try {
        const { clienteEmail, orderData, tipoSuscripcion, planId } = req.body;

        if (!clienteEmail || !orderData || !orderData.monto || !planId) {
            console.log('Faltan datos obligatorios');
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        // 1. Leer precios oficiales
        const preciosRaw = fs.readFileSync(preciosFile, 'utf-8');
        const precios = JSON.parse(preciosRaw);

        // 2. Validar tipo de suscripción
        const tipo = ['mensual', 'anual'].includes(tipoSuscripcion) ? tipoSuscripcion : 'mensual';

        // 3. Validar plan
        const precioOficial = precios[tipo]?.[planId.toLowerCase()];
        if (precioOficial === undefined) {
            return res.status(400).json({ message: `No existe el plan "${planId}" en los precios oficiales (${tipo})` });
        }

        // 4. Validar y calcular extras
        const isTitan = planId.toLowerCase() === 'titan';
        const isAnual = tipo === 'anual';
        const extrasGratisTitanAnual = ['logotipo', 'tpv', 'negocios'];
        const preciosExtras = precios[tipo]?.extras || {};

        let extrasTotales = 0;
        const extrasProcesados = [];

        if (Array.isArray(orderData.extrasSeleccionados)) {
            for (const extraKey of orderData.extrasSeleccionados) {
                const precioExtra = preciosExtras[extraKey];

                if (precioExtra === undefined) {
                    return res.status(400).json({ message: `El servicio extra "${extraKey}" no existe en los precios oficiales.` });
                }

                const esGratis = isTitan && isAnual && extrasGratisTitanAnual.includes(extraKey);

                if (!esGratis) {
                    extrasTotales += precioExtra;
                }

                extrasProcesados.push({
                    extraKey,
                    precio: esGratis ? 0 : precioExtra,
                    esGratis
                });
            }
        }

        const montoCalculado = precioOficial + extrasTotales;

        // 5. Validar monto enviado desde frontend
        const montoEnviado = Number(orderData.monto);
        if (isNaN(montoEnviado)) {
            return res.status(400).json({ message: 'Monto inválido enviado desde el frontend.' });
        }

        if (montoCalculado !== montoEnviado) {
            return res.status(400).json({
                message: `Diferencia en el monto detectada. Precio esperado: ${montoCalculado}, recibido: ${montoEnviado}`,
                detalles: {
                    plan: precioOficial,
                    extras: extrasProcesados,
                    montoCalculado,
                    montoEnviado
                }
            });
        }

        // 6. Preparar datos de Mercado Pago
        const isSandbox = process.env.NODE_ENV !== 'production';
        const payerEmail = isSandbox ? process.env.MP_PAYER_EMAIL : clienteEmail;

        const preapproval_data = {
            reason: `Suscripción ${orderData.nombrePaquete}`,
            auto_recurring: {
                frequency: 1,
                frequency_type: "months",
                transaction_amount: montoCalculado,
                currency_id: "MXN",
                start_date: new Date().toISOString(),
                end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            },
            back_url: "https://tlatec.teteocan.com",
            payer_email: payerEmail,
        };

        // 7. Crear suscripción en Mercado Pago
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

        // 8. Guardar orden en la base de datos
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
                montoCalculado,
                orderData.fecha,
                orderData.mensajeContinuar || 'La empresa se pondrá en contacto contigo para continuar con los siguientes pasos.',
                tipo
            ]);
            console.log(`Orden guardada: ${preapprovalId}`);
        } catch (err) {
            console.error('Error guardando orden en DB:', err);
        }

        // 9. Devolver el link de pago
        res.json({ init_point: data.init_point });

    } catch (error) {
        console.error('Error en crearSuscripcionDinamica:', error);
        res.status(500).json({ message: 'Error al crear suscripción', error: error.message });
    }
};

module.exports = { crearSuscripcionDinamica };
