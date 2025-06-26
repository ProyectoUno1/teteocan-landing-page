const fetch = require('node-fetch');

const crearSuscripcionDinamica = async (req, res) => {
  try {
    const { clienteEmail, orderData } = req.body;

    console.log('Datos recibidos para crear suscripción:', { clienteEmail, orderData });

    if (!clienteEmail || !orderData || !orderData.monto) {
      console.log('Faltan datos obligatorios');
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    // 👇 lógica para usar un correo de test en entorno de pruebas
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
    console.log('Respuesta de Mercado Pago:', data);

    // clienteEmail se conserva para uso interno (envío de correos, etc.)
    res.json({ init_point: data.init_point });

  } catch (error) {
    console.error('Error al crear suscripción dinámica:', error);
    res.status(500).json({ message: 'Error al crear suscripción', error: error.message });
  }
};

const webhookSuscripcion = async (req, res) => {
  try {
    const topic = req.query.topic || req.body.type;
    const id = req.query.id || req.body.data?.id;

    console.log('Webhook recibido:', req.body);

    res.sendStatus(200);
  } catch (error) {
    console.error('Error en webhook suscripción:', error);
    res.sendStatus(500);
  }
};

module.exports = { crearSuscripcionDinamica, webhookSuscripcion };
