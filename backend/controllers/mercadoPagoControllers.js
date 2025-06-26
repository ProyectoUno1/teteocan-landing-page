const fetch = require('node-fetch');
const emailController = require('../pdf/controllers/emailController');


const ordenesPendientes = {};

const crearSuscripcionDinamica = async (req, res) => {
    try {
        const { clienteEmail, orderData } = req.body;

        console.log('Datos recibidos para crear suscripción:', { clienteEmail, orderData });

        if (!clienteEmail || !orderData || !orderData.monto) {
            console.log('Faltan datos obligatorios');
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        // correo de test en entorno de pruebas
        const isSandbox = process.env.NODE_ENV !== 'production';
        const payerEmail = isSandbox
            ? process.env.MP_PAYER_EMAIL // correo de test user
            : clienteEmail;             // correo real en producción

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

        // guardar la orden en memoria con el preapproval_id que nos da Mercado Pago
        ordenesPendientes[data.id] = { clienteEmail, orderData };

        // enviar el link para redirigir al checkout
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

    // PAGO CREADO 
    if (topic === 'payment' || mpNotification.type === 'payment') {
      const paymentId = mpNotification.data?.id;

      if (!paymentId) {
        console.log('ID de pago no recibido');
        return res.status(400).send('Falta ID de pago');
      }

      // Llamar a la API de Mercado Pago para obtener los datos del pago
      const fetch = require('node-fetch');
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      });

      const paymentInfo = await response.json();

      // Extraer datos necesarios
      const nombrePaquete = paymentInfo.description || 'Suscripción';
      const monto = paymentInfo.transaction_amount || 0;
      const clienteEmail = paymentInfo.payer?.email || 'cliente@example.com';
      const fecha = new Date().toLocaleDateString('es-MX');

      // Crear estructura de datos simulando `orderData`
      const resumenServicios = 'Suscripción activa con Mercado Pago';
      const mensajeContinuar = 'La empresa se pondrá en contacto contigo para continuar con los siguientes pasos.';

      const mockReq = {
        body: {
          nombrePaquete,
          resumenServicios,
          monto,
          fecha,
          clienteEmail,
          mensajeContinuar,
        },
      };

      const mockRes = { status: () => ({ json: () => {} }) };

      // Enviar correos
      await emailController.sendOrderConfirmationToCompany(mockReq, mockRes);
      await emailController.sendPaymentConfirmationToClient(mockReq, mockRes);

      console.log('Correos enviados correctamente para payment.created');
      return res.status(200).send('Webhook procesado correctamente');
    }

    // PREAPPROVAL AUTORIZADO (mantenerlo como respaldo si se usa ordenesPendientes) ===
    if (topic === 'preapproval' && action === 'authorized') {
      const preapproval_id = mpNotification.data?.id;
      const orden = ordenesPendientes[preapproval_id];

      if (orden) {
        const reqMock = { body: orden.orderData };
        const resMock = { status: () => ({ json: () => {} }) };

        await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
        await emailController.sendPaymentConfirmationToClient(reqMock, resMock);

        delete ordenesPendientes[preapproval_id];
        return res.status(200).send('Webhook preapproval autorizado y correos enviados');
      }

      return res.status(200).send('Webhook preapproval recibido pero sin orden en memoria');
    }

    return res.status(200).send('Evento no relevante');
  } catch (error) {
    console.error(' Error en webhook:', error);
    return res.status(500).send('Error interno del servidor');
  }
};

module.exports = { crearSuscripcionDinamica, webhookSuscripcion };


