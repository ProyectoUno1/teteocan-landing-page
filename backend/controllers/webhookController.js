const fetch = require('node-fetch');
const pool = require('../db');
const emailController = require('../pdf/controllers/emailController');

const webhookSuscripcion = async (req, res) => {
    try {
        const mpNotification = req.body;
        const topic = req.query.topic || mpNotification.type || mpNotification.topic;
        const action = mpNotification.action;

        // Paso: pago confirmado
        if ((topic === 'payment' || mpNotification.type === 'payment') && mpNotification.data?.id) {
            const paymentId = mpNotification.data.id;

            // Obtener información del pago
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
            });
            const paymentInfo = await response.json();

            // Obtener preapprovalId
            const preapprovalId = paymentInfo.preapproval_id
                || paymentInfo.subscription_id
                || paymentInfo.point_of_interaction?.transaction_data?.subscription_id;

            if (!preapprovalId) {
                console.log('No se encontró preapprovalId en la info del pago.');
                return res.status(200).send('Webhook recibido sin preapprovalId');
            }

            // Buscar orden en la base de datos
            const result = await pool.query('SELECT * FROM ventas WHERE preapproval_id = $1', [preapprovalId]);
            const row = result.rows[0];

            if (!row) {
                console.log('Orden no encontrada para preapprovalId:', preapprovalId);
                return res.status(200).send('Orden no encontrada, webhook ignorado');
            }

            // Solo actualizar si aún no está procesada
            if (row.estado !== 'procesada') {
                await pool.query('UPDATE ventas SET estado = $1 WHERE preapproval_id = $2', ['procesada', preapprovalId]);
                console.log(`Estado actualizado a 'procesada' para orden ${preapprovalId}`);

                // Enviar correos
                const reqMock = {
                    body: {
                        nombrePaquete: row.nombre_paquete,
                        resumenServicios: row.resumen_servicios,
                        monto: row.monto,
                        tipoSuscripcion: row.tipo_suscripcion,
                        fecha: row.fecha,
                        clienteEmail: row.cliente_email,
                        mensajeContinuar: row.mensaje_continuar
                    }
                };
                const resMock = { status: () => ({ json: () => { } }) };

                await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
                await emailController.sendPaymentConfirmationToClient(reqMock, resMock);
                console.log(`Correos enviados para orden ${preapprovalId}`);
            } else {
                console.log(`Orden ${preapprovalId} ya estaba procesada.`);
            }

            return res.status(200).send('Webhook procesado correctamente');
        }

        // Paso: autorización de preaprobación (opcional)
        if (topic === 'preapproval' && action === 'authorized') {
            console.log('Preapproval autorizado, sin acción requerida.');
            return res.status(200).send('Preapproval autorizado');
        }

        return res.status(200).send('Evento no relevante');
    } catch (error) {
        console.error('Error en webhook:', error);
        return res.status(500).send('Error interno del servidor');
    }
};

module.exports = { webhookSuscripcion };
