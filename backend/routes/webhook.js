const express = require('express');
const router = express.Router();
const emailController = require('../pdf/controllers/emailController');

router.post('/', async (req, res) => {
  try {
    const mpNotification = req.body;
    console.log('Webhook recibido:', JSON.stringify(mpNotification, null, 2));

    const topic = req.query.topic || mpNotification.type || mpNotification.topic;
    const action = mpNotification.action;

    if (topic === 'preapproval' && action === 'authorized') {
      const data = mpNotification.data || {};
      const orderData = {
        nombrePaquete: data.reason || 'Paquete sin nombre',
        resumenServicios: 'Servicios incluidos no especificados',
        monto: data.auto_recurring?.transaction_amount || 0,
        fecha: new Date().toLocaleDateString('es-MX'),
        clienteEmail: data.payer_email || 'cliente@example.com',
        mensajeContinuar: "Gracias por tu suscripción. Pronto nos pondremos en contacto contigo."
      };

      const reqMock = { body: orderData };
      const resMock = { status: () => ({ json: () => {} }) };

      await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
      await emailController.sendPaymentConfirmationToClient(reqMock, resMock);

      return res.status(200).send('Webhook recibido y correos enviados.');
    }

    return res.status(200).send('Evento no relevante.');
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return res.status(500).send('Error interno del servidor');
  }
});

module.exports = router;
