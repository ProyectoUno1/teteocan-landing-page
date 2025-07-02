const fetch = require('node-fetch');
const pool = require('../db');
const emailController = require('../pdf/controllers/emailController');

const webhookSuscripcion = async (req, res) => {
    try {
        const mpNotification = req.body;
        const topic = req.query.topic || mpNotification.type || mpNotification.topic;
        const action = mpNotification.action;

        // Pago confirmado
        if ((topic === 'payment' || mpNotification.type === 'payment') && mpNotification.data?.id) {
            const paymentId = mpNotification.data.id;

            // Obtener info del pago
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
            });
            const paymentInfo = await response.json();

            const preapprovalId = paymentInfo.preapproval_id
                || paymentInfo.subscription_id
                || paymentInfo.point_of_interaction?.transaction_data?.subscription_id;

            if (!preapprovalId) {
                console.log('No se encontró preapprovalId en la info del pago.');
                return res.status(200).send('Webhook recibido sin preapprovalId');
            }

            // Buscar orden en BD
            const result = await pool.query('SELECT * FROM ventas WHERE preapproval_id = $1', [preapprovalId]);
            const row = result.rows[0];

            // Leer metadata enviado en la suscripción
            const meta = paymentInfo.metadata || {};

            // Si no existe registro, crear uno nuevo solo si el pago está aprobado
            if (!row) {
                if (paymentInfo.status === 'approved') {
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
                        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, 'pendiente')
                    `, [
                        preapprovalId,
                        meta.clienteEmail || paymentInfo.payer?.email || 'email_desconocido@correo.com',
                        meta.nombrePaquete || 'Paquete desconocido',
                        meta.resumenServicios || 'Sin servicios',
                        meta.monto || paymentInfo.transaction_amount || 0,
                        meta.mensajeContinuar || 'La empresa se pondrá en contacto contigo.',
                        meta.tipoSuscripcion || 'mensual',
                    ]);
                    console.log(`Orden creada desde webhook: ${preapprovalId}`);

                    // Recuperar fila para enviar correos
                    const newResult = await pool.query('SELECT * FROM ventas WHERE preapproval_id = $1', [preapprovalId]);
                    const newRow = newResult.rows[0];

                    if (newRow) {
                        const reqMock = {
                            body: {
                                nombrePaquete: newRow.nombre_paquete,
                                resumenServicios: newRow.resumen_servicios,
                                monto: newRow.monto,
                                tipoSuscripcion: newRow.tipo_suscripcion,
                                fecha: newRow.fecha,
                                clienteEmail: newRow.cliente_email,
                                mensajeContinuar: newRow.mensaje_continuar
                            }
                        };
                        const resMock = { status: () => ({ json: () => { } }) };

                        await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
                        await emailController.sendPaymentConfirmationToClient(reqMock, resMock);

                        await pool.query('UPDATE ventas SET estado = $1 WHERE preapproval_id = $2', ['procesada', preapprovalId]);
                        console.log(`Correos enviados y estado actualizado para orden recién creada ${preapprovalId}`);
                    }
                } else {
                    console.log('Pago no aprobado, no se registra en base de datos.');
                    return res.status(200).send('Pago no aprobado, no se crea registro');
                }
            } else if (row.estado !== 'procesada') {
                // Enviar correos para orden existente no procesada
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

                await pool.query('UPDATE ventas SET estado = $1 WHERE preapproval_id = $2', ['procesada', preapprovalId]);
                console.log(`Correos enviados y estado actualizado para orden ${preapprovalId}`);
            } else {
                console.log(`Orden ${preapprovalId} ya estaba procesada.`);
            }

            return res.status(200).send('Webhook procesado correctamente');
        }

        // Autorización preaprobación (opcional)
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
