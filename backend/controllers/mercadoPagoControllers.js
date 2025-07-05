const fs = require('fs');
const path = require('path');
const pool = require('../db');
const mercadopago = require('mercadopago'); // Importa el SDK

// Configura el SDK con tu token
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

const preciosFile = path.join(__dirname, '../precios.json');

const crearSuscripcionDinamica = async (req, res) => {
  try {
    const { clienteEmail, orderData, tipoSuscripcion, planId } = req.body;

    if (!clienteEmail || !orderData || !orderData.monto || !planId) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    // Leer precios oficiales
    const preciosRaw = fs.readFileSync(preciosFile, 'utf-8');
    const precios = JSON.parse(preciosRaw);
    const tipo = ['mensual', 'anual'].includes(tipoSuscripcion) ? tipoSuscripcion : 'mensual';

    const precioOficial = precios[tipo]?.[planId.toLowerCase()];
    if (precioOficial === undefined) {
      return res.status(400).json({ message: `No existe el plan "${planId}"` });
    }

    // Calcular extras
    const isTitan = planId.toLowerCase() === 'titan';
    const isAnual = tipo === 'anual';
    const extrasGratis = ['logotipo', 'tpv', 'negocios'];
    const preciosExtras = precios[tipo]?.extras || {};
    let extrasTotales = 0;

    for (const extra of orderData.extrasSeleccionados || []) {
      const precioExtra = preciosExtras[extra];
      if (precioExtra === undefined) {
        return res.status(400).json({ message: `Extra "${extra}" no existe.` });
      }
      const esGratis = isTitan && isAnual && extrasGratis.includes(extra);
      if (!esGratis) extrasTotales += precioExtra;
    }

    const montoCalculado = precioOficial + extrasTotales;
    if (Number(orderData.monto) !== montoCalculado) {
      return res.status(400).json({
        message: `Monto incorrecto. Esperado: ${montoCalculado}, recibido: ${orderData.monto}`
      });
    }

    const payerEmail = process.env.NODE_ENV !== 'production'
      ? process.env.MP_PAYER_EMAIL
      : clienteEmail;

    console.log('payer_email usado:', payerEmail);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    const preapprovalData = {
      reason: `Suscripción ${orderData.nombrePaquete}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: tipo === 'anual' ? 'years' : 'months',
        transaction_amount: montoCalculado,
        currency_id: "MXN",
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
      },
      back_url: "https://tlatec.teteocan.com",
      payer_email: payerEmail
    };

    // Crear suscripción con el SDK
    const preapproval = await mercadopago.preapproval.create(preapprovalData);
    const data = preapproval.body || preapproval.response || preapproval;
    const preapprovalId = data.id;

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
      ) VALUES ($1,$2,$3,$4,$5,NOW(),$6,$7,'pendiente')
      ON CONFLICT (preapproval_id) DO NOTHING;
    `, [
      preapprovalId,
      clienteEmail,
      orderData.nombrePaquete,
      orderData.resumenServicios,
      montoCalculado,
      orderData.mensajeContinuar || 'La empresa se pondrá en contacto contigo.',
      tipo
    ]);

    res.json({ init_point: data.init_point });

  } catch (error) {
    console.error('Error en crearSuscripcionDinamica (SDK):', error);
    res.status(500).json({
      message: 'Error al crear suscripción',
      error: error.message || 'Error desconocido'
    });
  }
};

module.exports = { crearSuscripcionDinamica };
