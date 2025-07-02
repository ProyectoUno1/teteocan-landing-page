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

            // Obtener información del pago en Mercado Pago
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

            // Verificar si la orden ya existe
            const existingOrder = await pool.query('SELECT * FROM ventas WHERE preapproval_id = $1', [preapprovalId]);

            if (existingOrder.rows.length === 0) {
                // Si no existe, insertar la orden (obteniendo los datos necesarios del paymentInfo)
                // *** Aquí debes decidir cómo obtener datos de la orden para guardar (puedes incluirlos en metadata en MP o buscar en otra tabla)

                // Como ejemplo, guardamos con datos mínimos:
                await pool.query(`
                    INSERT INTO ventas (
                        preapproval_id,
                        cliente_email,
                        nombre_paquete,
                        resumen_servicios,
                        monto,
                        fecha,
                        mensaje_continuar,
                        tipo_suscripcion,
                        estado
                    ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, 'procesada')
                `, [
                    preapprovalId,
                    paymentInfo.payer?.email || 'email_desconocido@example.com',
                    'Paquete desconocido',
                    'Servicios desconocidos',
                    paymentInfo.transaction_amount || 0,
                    'La empresa se pondrá en contacto contigo para continuar con los siguientes pasos.',
                    'mensual'
                ]);
            } else {
                // Si existe, actualizar estado
                await pool.query('UPDATE ventas SET estado = $1 WHERE preapproval_id = $2', ['procesada', preapprovalId]);
            }

            // Recuperar orden para enviar correos
            const orderResult = await pool.query('SELECT * FROM ventas WHERE preapproval_id = $1', [preapprovalId]);
            const order = orderResult.rows[0];

            if (order) {
                const reqMock = {
                    body: {
                        nombrePaquete: order.nombre_paquete,
                        resumenServicios: order.resumen_servicios,
                        monto: order.monto,
                        tipoSuscripcion: order.tipo_suscripcion,
                        fecha: order.fecha,
                        clienteEmail: order.cliente_email,
                        mensajeContinuar: order.mensaje_continuar
                    }
                };
                const resMock = { status: () => ({ json: () => { } }) };

                await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
                await emailController.sendPaymentConfirmationToClient(reqMock, resMock);
            } else {
                console.log('Orden no encontrada para enviar correos:', preapprovalId);
            }

            return res.status(200).send('Webhook procesado y correos enviados');
        }

        // Paso: autorización de preaprobación (opcional)
        if (topic === 'preapproval' && action === 'authorized') {
            // Similar lógica si quieres procesar cuando se autoriza la suscripción
            return res.status(200).send('Webhook preapproval autorizado');
        }

        return res.status(200).send('Evento no relevante');
    } catch (error) {
        console.error('Error en webhook:', error);
        return res.status(500).send('Error interno del servidor');
    }
};

module.exports = { webhookSuscripcion };
