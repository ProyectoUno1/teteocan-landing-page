const fs = require('fs');
const path = require('path');
// En Node 22 fetch está nativo, no necesitas importar node-fetch
const db = require('../db');

const preciosFile = path.join(__dirname, '../precios.json');

const crearSuscripcionDinamica = async (req, res) => {
    try {
        const { clienteEmail, orderData, tipoSuscripcion, planId } = req.body;

        if (!clienteEmail || !orderData || !orderData.monto || !planId) {
            console.log('Faltan datos obligatorios');
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        // Leer precios desde archivo JSON
        const preciosRaw = fs.readFileSync(preciosFile, 'utf-8');
        const precios = JSON.parse(preciosRaw);

        // Validar tipo de suscripción
        const tipo = ['mensual', 'anual'].includes(tipoSuscripcion) ? tipoSuscripcion : 'mensual';

        // Validar que el plan exista en precios oficiales
        const precioOficial = precios[tipo]?.[planId.toLowerCase()];
        if (precioOficial === undefined) {
            return res.status(400).json({ message: `No existe el plan "${planId}" en los precios oficiales (${tipo})` });
        }

        // Verificar si hay extras con costo (sumar monto si es necesario)
        let montoFinal = precioOficial;
        if (orderData.monto && Number(orderData.monto) > precioOficial) {
            montoFinal = Number(orderData.monto);
        }

        // determinar si estamos en modo sandbox o producción
        const isSandbox = process.env.NODE_ENV !== 'production';

        // en sandbox usar un email fijo para pruebas, en producción usar el email del cliente
        const payerEmail = isSandbox ? process.env.MP_PAYER_EMAIL : clienteEmail;

        // crear el objeto con los datos para la suscripción (preapproval)
        const preapproval_data = {
            reason: `Suscripción ${orderData.nombrePaquete}`,
            auto_recurring: {
                frequency: 1,                // repetición mensual
                frequency_type: "months",
                transaction_amount: montoFinal, // monto de la suscripción
                currency_id: "MXN",
                start_date: new Date().toISOString(),
                // fecha final: 1 año a partir de hoy (la suscripcion se cobra mensualmente durante un año, despues de ese año se cancela)
                end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            },
            back_url: "https://tlatec.teteocan.com",  // URL para volver después del pago
            payer_email: payerEmail,
        };

        // enviar petición POST a la API de Mercado Pago para crear la suscripción
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

        // Guardar en SQLite
        db.run(`
          INSERT OR REPLACE INTO ordenes (
            preapproval_id, cliente_email, nombre_paquete, resumen_servicios, monto, fecha, mensaje_continuar
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            preapprovalId,
            clienteEmail,
            orderData.nombrePaquete,
            orderData.resumenServicios,
            montoFinal,
            orderData.fecha || new Date().toLocaleDateString('es-MX'),
            orderData.mensajeContinuar || 'La empresa se pondrá en contacto contigo para continuar con los siguientes pasos.'
        ], (err) => {
            if (err) {
                console.error('Error al guardar la orden en SQLite:', err);
            } else {
                console.log(`Orden con preapproval_id ${preapprovalId} guardada en SQLite`);
            }
        });

        // Responder con el link para completar el pago
        res.json({ init_point: data.init_point });

    } catch (error) {
        console.error('Error en crearSuscripcionDinamica:', error);
        res.status(500).json({ message: 'Error al crear suscripción', error: error.message });
    }
};

module.exports = { crearSuscripcionDinamica };
