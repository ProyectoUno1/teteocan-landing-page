const fetch = require('node-fetch');
const emailController = require('../pdf/controllers/emailController');
const fs = require('fs');
const path = require('path');

const ordenesPendientes = {};

const crearSuscripcionDinamica = async (req, res) => {
  try {
    const { clienteEmail, orderData } = req.body;

    // Guardar datos recibidos temporalmente
    const rutaArchivo = path.join(__dirname, 'tempDatosCrearSuscripcion.json');
    fs.writeFile(rutaArchivo, JSON.stringify({ clienteEmail, orderData }, null, 2), (err) => {
      if (err) {
        console.error('Error guardando archivo temporal en crearSuscripcionDinamica:', err);
      } else {
        console.log('Datos de crearSuscripcionDinamica guardados temporalmente');
      }
    });

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

    ordenesPendientes[data.id] = { clienteEmail, orderData };

    res.json({ init_point: data.init_point });

  } catch (error) {
    res.status(500).json({ message: 'Error al crear suscripción', error: error.message });
  }
};

async function procesarEnvioCorreosConOrden(orderData) {
  const reqMock = { body: orderData };
  const resMock = { status: () => ({ json: () => {} }) };

  await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
  await emailController.sendPaymentConfirmationToClient(reqMock, resMock);
}

const webhookSuscripcion = async (req, res) => {
  try {
    // Guardar datos del webhook temporalmente
    const rutaArchivoWebhook = path.join(__dirname, 'tempDatosWebhook.json');
    fs.writeFile(rutaArchivoWebhook, JSON.stringify(req.body, null, 2), (err) => {
      if (err) {
        console.error('Error guardando archivo temporal en webhookSuscripcion:', err);
      } else {
        console.log('Datos de webhookSuscripcion guardados temporalmente');
      }
    });

    const mpNotification = req.body;
    const topic = req.query.topic || mpNotification.type || mpNotification.topic;
    const action = mpNotification.action;

    console.log('Webhook recibido:', topic, action);

    if (topic === 'payment' || mpNotification.type === 'payment') {
      const paymentId = mpNotification.data?.id;
      if (!paymentId) {
        console.log('ID de pago no recibido');
        return res.status(400).send('Falta ID de pago');
      }

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      });
      const paymentInfo = await response.json();

      const preapprovalId = mpNotification.preapproval_id || mpNotification.data?.preapproval_id;

      const orden = ordenesPendientes[preapprovalId];

      if (orden) {
        console.log('orden.orderData en webhook:', orden.orderData);
        await procesarEnvioCorreosConOrden(orden.orderData);
        delete ordenesPendientes[preapprovalId];
      } else {
        const nombrePaquete = paymentInfo.description || 'Suscripción';
        const monto = paymentInfo.transaction_amount || 0;
        const clienteEmail = paymentInfo.payer?.email || 'cliente@example.com';
        const fecha = new Date().toLocaleDateString('es-MX');
        const resumenServicios = '';
        const mensajeContinuar = 'La empresa se pondrá en contacto contigo para continuar con los siguientes pasos.';

        const orderDataFallback = { nombrePaquete, resumenServicios, monto, fecha, clienteEmail, mensajeContinuar };
        await procesarEnvioCorreosConOrden(orderDataFallback);
      }

      return res.status(200).send('Webhook procesado correctamente');
    }

    if (topic === 'preapproval' && action === 'authorized') {
      const preapproval_id = mpNotification.data?.id;
      const orden = ordenesPendientes[preapproval_id];

      if (orden) {
        await procesarEnvioCorreosConOrden(orden.orderData);
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
