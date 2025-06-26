const fetch = require('node-fetch');

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

    if (topic === 'preapproval' && action === 'authorized') {
      const preapproval_id = mpNotification.data.id;

      // Busca la orden guardada en memoria
      const orden = ordenesPendientes[preapproval_id];

      if (!orden) {
        console.log('Orden no encontrada para preapproval_id:', preapproval_id);

        // crear orden mínima para enviar correos igual (prueba rápida)
        const orderData = {
          nombrePaquete: mpNotification.reason || 'Paquete sin nombre',
          resumenServicios: 'Servicios no especificados',
          monto: mpNotification.auto_recurring?.transaction_amount || 0,
          fecha: new Date().toLocaleDateString('es-MX'),
          clienteEmail: mpNotification.payer_email || 'cliente@example.com',
          mensajeContinuar: "Gracias por tu suscripción. Pronto nos pondremos en contacto contigo."
        };

        const reqMock = { body: orderData };
        const resMock = { status: () => ({ json: () => {} }) };

        const emailController = require('../pdf/controllers/emailController');
        await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
        await emailController.sendPaymentConfirmationToClient(reqMock, resMock);

        return res.status(200).send('Webhook recibido, orden no encontrada, correos enviados con datos mínimos.');
      }

      // Orden encontrada, envía correos con datos reales
      const emailController = require('../pdf/controllers/emailController');
      const reqMock = { body: orden.orderData };
      const resMock = { status: () => ({ json: () => {} }) };

      await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
      await emailController.sendPaymentConfirmationToClient(reqMock, resMock);

      // Eliminar orden de memoria
      delete ordenesPendientes[preapproval_id];

      return res.status(200).send('Webhook recibido y correos enviados.');
    }

    return res.status(200).send('Evento no relevante.');
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return res.status(500).send('Error interno del servidor');
  }
};

module.exports = { crearSuscripcionDinamica, webhookSuscripcion };