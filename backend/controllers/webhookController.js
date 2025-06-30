const fetch = require('node-fetch');
const db = require('../db');
const emailController = require('../pdf/controllers/emailController');

/**
 * controlador para manejar notificaciones webhook de Mercado Pago.
 * procesa eventos de pago o autorización de suscripciones.
 * envía correos confirmando el pago y elimina la orden guardada.
 */
const webhookSuscripcion = async (req, res) => {
    try {
        const mpNotification = req.body;
        // determina tipo de evento (topic) y acción (action) recibidos
        const topic = req.query.topic || mpNotification.type || mpNotification.topic;
        const action = mpNotification.action;

        // paso: pago confirmado
        if ((topic === 'payment' || mpNotification.type === 'payment') && mpNotification.data?.id) {
            const paymentId = mpNotification.data.id;

            // aolicita información detallada del pago a la API de Mercado Pago
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

            // consulta la orden guardada para el preapprovalId en SQLite
            db.get(`SELECT * FROM ordenes WHERE preapproval_id = ?`, [preapprovalId], async (err, row) => {
                if (err) {
                    console.error('Error consultando orden en SQLite:', err);
                    return res.status(500).send('Error al buscar orden');
                }

                if (row) {
                    // reutilizar funciones de envío de email
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

                    // envía correos a empresa y cliente confirmando la orden y pago
                    await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
                    await emailController.sendPaymentConfirmationToClient(reqMock, resMock);

                    // elimina la orden porque ya fue procesada
                    db.run('DELETE FROM ordenes WHERE preapproval_id = ?', [preapprovalId]);
                    return res.status(200).send('Webhook procesado y correos enviados');
                } else {
                    console.log('Orden no encontrada en DB para preapproval_id:', preapprovalId);
                    return res.status(200).send('Webhook recibido pero sin orden asociada');
                }
            });

            return; // para evitar responder dos veces
        }

        // paso: autorización de preaprobación de suscripción
        if (topic === 'preapproval' && action === 'authorized') {
            const preapprovalId = mpNotification.data?.id;

            db.get(`SELECT * FROM ordenes WHERE preapproval_id = ?`, [preapprovalId], async (err, row) => {
                if (err) {
                    console.error('Error consultando orden en SQLite:', err);
                    return res.status(500).send('Error al buscar orden');
                }

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

                    db.run('DELETE FROM ordenes WHERE preapproval_id = ?', [preapprovalId]);
                    return res.status(200).send('Webhook preapproval autorizado y correos enviados');
                } else {
                    console.log('Orden preapproval no encontrada en DB:', preapprovalId);
                    return res.status(200).send('Webhook preapproval sin orden');
                }
            });

            return;
        }

        // responder OK a otros eventos no manejados explícitamente
        return res.status(200).send('Evento no relevante');

    } catch (error) {
        console.error('Error en webhook:', error);
        return res.status(500).send('Error interno del servidor');
    }
};

module.exports = { webhookSuscripcion };
