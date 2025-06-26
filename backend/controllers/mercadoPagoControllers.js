const emailController = require('../pdf/controllers/emailController');

const ordenesPendientes = {}; // (puedes conservarla si aún usas preapproval_id)

const webhookSuscripcion = async (req, res) => {
  try {
    const mpNotification = req.body;
    const topic = req.query.topic || mpNotification.type || mpNotification.topic;
    const action = mpNotification.action;

    console.log('Webhook recibido:', topic, action);

    // === CASO 1: PAGO CREADO ===
    if (topic === 'payment' || mpNotification.type === 'payment') {
      const paymentId = mpNotification.data?.id;

      if (!paymentId) {
        console.log('ID de pago no recibido');
        return res.status(400).send('Falta ID de pago');
      }

      // Llama a la API de Mercado Pago para obtener los datos del pago
      const fetch = require('node-fetch');
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      });

      const paymentInfo = await response.json();

      // Extrae datos necesarios
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

    // === CASO 2: PREAPPROVAL AUTORIZADO (puedes mantenerlo como respaldo si usas ordenesPendientes) ===
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
    console.error('Error en webhook:', error);
    return res.status(500).send('Error interno del servidor');
  }
};

module.exports = { crearSuscripcionDinamica, webhookSuscripcion };