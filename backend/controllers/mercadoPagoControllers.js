const fetch = require('node-fetch');
const emailController = require('../pdf/controllers/emailController');
const db = require('../db');

const crearSuscripcionDinamica = async (req, res) => {
    try {
        const { clienteEmail, orderData } = req.body;

        console.log('Datos recibidos para crear suscripción:', { clienteEmail, orderData });

        if (!clienteEmail || !orderData || !orderData.monto) {
            console.log('Faltan datos obligatorios');
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        const isSandbox = process.env.NODE_ENV !== 'production';
        const payerEmail = isSandbox ? process.env.MP_PAYER_EMAIL : clienteEmail;

        const preapproval_data = {
            reason: `Suscripción ${orderData.nombrePaquete}`,
            auto_recurring: {
                frequency: 1,
                frequency_type: "months",
                transaction_amount: Number(orderData.monto),
                currency_id: "MXN",
                start_date: new Date().toISOString(),
                end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            },
            back_url: "https://tlatec.teteocan.com",
            payer_email: payerEmail,
        };

        console.log('Datos para crear preapproval:', preapproval_data);

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
            orderData.monto,
            orderData.fecha,
            orderData.mensajeContinuar || 'La empresa se pondrá en contacto contigo para continuar con los siguientes pasos.'
        ], (err) => {
            if (err) {
                console.error('Error al guardar la orden en SQLite:', err);
            } else {
                console.log(`Orden con preapproval_id ${preapprovalId} guardada en SQLite`);
            }
        });

        res.json({ init_point: data.init_point });

    } catch (error) {
        res.status(500).json({ message: 'Error al crear suscripción', error: error.message });
    }
};

const webhookSuscripcion = async (req, res) => {
    try {
        const mpNotification = req.body;
        const topic = req.query.topic || mpNotification.type || mpNotification.topic;
        const action = mpNotification.action;

        console.log('Webhook recibido:', topic, action);

        if ((topic === 'payment' || mpNotification.type === 'payment') && mpNotification.data?.id) {
            const paymentId = mpNotification.data.id;

            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
            });

            const paymentInfo = await response.json();
            console.log('Info pago recibida:', paymentInfo);
            const preapprovalId = paymentInfo.preapproval_id;

            db.get(`SELECT * FROM ordenes WHERE preapproval_id = ?`, [preapprovalId], async (err, row) => {
                if (err) {
                    console.error(' Error consultando orden en SQLite:', err);
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
                    return res.status(200).send('Webhook procesado y correos enviados');
                } else {
                    console.log('Orden no encontrada en DB para preapproval_id:', preapprovalId);
                    return res.status(200).send('Webhook recibido pero sin orden asociada');
                }
            });


            return; // Esto previene cualquier intento de respuesta posterior
        }


        if (topic === 'preapproval' && action === 'authorized') {
            const preapprovalId = mpNotification.data?.id;

            db.get(`SELECT * FROM ordenes WHERE preapproval_id = ?`, [preapprovalId], async (err, row) => {
                if (err) {
                    console.error('Error consultando orden en SQLite:', err);
                    return res.status(500).send('Error al buscar orden');
                }

                if (row) {
                    // ...envío de correos
                    db.run('DELETE FROM ordenes WHERE preapproval_id = ?', [preapprovalId]);
                    return res.status(200).send('Webhook preapproval autorizado y correos enviados');
                } else {
                    console.log('Orden preapproval no encontrada en DB:', preapprovalId);
                    return res.status(200).send('Webhook preapproval sin orden');
                }
            });

            return;
        }

        return res.status(200).send('Evento no relevante');
    } catch (error) {
        console.error('Error en webhook:', error);
        return res.status(500).send('Error interno del servidor');
    }
};

module.exports = { crearSuscripcionDinamica, webhookSuscripcion };