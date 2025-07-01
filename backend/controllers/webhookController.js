const fetch = require('node-fetch');
const pool = require('../db');
const emailController = require('../pdf/controllers/emailController');


/**
 * controlador para manejar notificaciones webhook de Mercado Pago.
 * procesa eventos de pago o autorización de suscripciones.
 * envía correos confirmando el pago y elimina la orden guardada.
 */

const webhookSuscripcion = async (req, res) => {
    try {
        const mpNotification = req.body;
        const topic = req.query.topic || mpNotification.type || mpNotification.topic;
        const action = mpNotification.action;

        // paso: pago confirmado
        if ((topic === 'payment' || mpNotification.type === 'payment') && mpNotification.data?.id) {
            const paymentId = mpNotification.data.id;

            // solicita información detallada del pago a la API de Mercado Pago
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
            });
            const paymentInfo = await response.json();
            // extraer el preapprovalId desde varios campos posibles
            const preapprovalId = paymentInfo.preapproval_id
                || paymentInfo.subscription_id
                || paymentInfo.point_of_interaction?.transaction_data?.subscription_id;

            if (!preapprovalId) {
                console.log('No se encontró preapprovalId en la info del pago.');
                return res.status(200).send('Webhook recibido sin preapprovalId');
            }

            try {
                const result = await pool.query('SELECT * FROM ventas WHERE preapproval_id = $1', [preapprovalId]);
                const row = result.rows[0];

                if (row) {
                    const reqMock = {
                        body: {
                            nombrePaquete: row.nombre_paquete,
                            resumenServicios: row.resumen_servicios,
                            monto: row.monto,
                            fecha: row.fecha,
                            clienteEmail: row.cliente_email,
                            mensajeContinuar: row.mensaje_continuar
                        }
                    };
                    const resMock = { status: () => ({ json: () => { } }) };

                    await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
                    await emailController.sendPaymentConfirmationToClient(reqMock, resMock);

                    await pool.query('DELETE FROM ventas WHERE preapproval_id = $1', [preapprovalId]);

                    return res.status(200).send('Webhook procesado y correos enviados');
                } else {
                    console.log('Orden no encontrada en DB para preapproval_id:', preapprovalId);
                    return res.status(200).send('Webhook recibido pero sin orden asociada');
                }
            } catch (err) {
                console.error('Error consultando Neon:', err);
                return res.status(500).send('Error al buscar orden');
            }
        }
        // paso: autorización de preaprobación de suscripción
        if (topic === 'preapproval' && action === 'authorized') {
            const preapprovalId = mpNotification.data?.id;

            try {
                const result = await pool.query('SELECT * FROM ventas WHERE preapproval_id = $1', [preapprovalId]);
                const row = result.rows[0];

                if (row) {
                    const reqMock = {
                        body: {
                            nombrePaquete: row.nombre_paquete,
                            resumenServicios: row.resumen_servicios,
                            monto: row.monto,
                            fecha: row.fecha,
                            clienteEmail: row.cliente_email,
                            mensajeContinuar: row.mensaje_continuar
                        }
                    };
                    const resMock = { status: () => ({ json: () => { } }) };

                    await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
                    await emailController.sendPaymentConfirmationToClient(reqMock, resMock);

                    await pool.query('DELETE FROM ventas WHERE preapproval_id = $1', [preapprovalId]);

                    return res.status(200).send('Webhook preapproval autorizado y correos enviados');
                } else {
                    console.log('Orden preapproval no encontrada en DB:', preapprovalId);
                    return res.status(200).send('Webhook preapproval sin orden');
                }
            } catch (err) {
                console.error('Error consultando Neon:', err);
                return res.status(500).send('Error al buscar orden');
            }
        }

        return res.status(200).send('Evento no relevante');

    } catch (error) {
        console.error('Error en webhook:', error);
        return res.status(500).send('Error interno del servidor');
    }
};

module.exports = { webhookSuscripcion };
