const mercadopago = require('mercadopago');
const { sendOrderConfirmationToCompany, sendPaymentConfirmationToClient } = require('../pdf/controllers/emailController');

mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

const crearSuscripcionDinamica = async (req, res) => {
  try {
    const { clienteEmail, orderData } = req.body;

    if (!clienteEmail || !orderData || !orderData.monto) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

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
      payer_email: clienteEmail,
    };

    const response = await mercadopago.preapproval.create(preapproval_data);
    res.json({ init_point: response.body.init_point });

  } catch (error) {
    console.error('Error al crear suscripción dinámica:', error);
    res.status(500).json({ message: 'Error al crear suscripción' });
  }
};

const webhookSuscripcion = async (req, res) => {
  try {
    const topic = req.query.topic || req.body.type;
    const id = req.query.id || req.body.data?.id;

    if (topic === 'preapproval' && id) {
      const response = await mercadopago.preapproval.findById(id);
      const subscription = response.body;

      if (subscription.status === 'authorized' || subscription.status === 'active') {
        const orderData = {
          nombrePaquete: subscription.reason || 'Sin nombre',
          resumenServicios: 'Servicios incluidos (no especificados en webhook)',
          monto: subscription.auto_recurring.transaction_amount,
          fecha: new Date().toLocaleDateString('es-MX'),
          clienteEmail: subscription.payer_email,
          mensajeContinuar: "Gracias por tu suscripción. Pronto nos pondremos en contacto contigo."
        };

        const reqMock = { body: orderData };
        const resMock = { status: () => ({ json: () => {} }) };

        await sendOrderConfirmationToCompany(reqMock, resMock);
        await sendPaymentConfirmationToClient(reqMock, resMock);

        console.log(`Suscripción ${subscription.id} confirmada y correos enviados.`);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error en webhook suscripción:', error);
    res.sendStatus(500);
  }
};

module.exports = { crearSuscripcionDinamica, webhookSuscripcion };
