const pool = require('../db');
const emailController = require('../pdf/controllers/emailController');
const { MercadoPagoConfig, Payment } = require('mercadopago');

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const paymentAPI = new Payment(mpClient);

const webhookSuscripcion = async (req, res) => {
  try {
    const mpNotification = req.body;
    const topic = req.query.topic || mpNotification.type || mpNotification.topic;
    const action = mpNotification.action;

    if ((topic === 'payment' || mpNotification.type === 'payment') && mpNotification.data?.id) {
      const paymentId = mpNotification.data.id;

      let paymentInfo;
      try {
        const result = await paymentAPI.get({ id: paymentId });
        paymentInfo = result.body || result; 
      } catch (error) {
        console.error('Error obteniendo el pago:', error);
        return res.status(500).send('Error consultando el pago');
      }

      console.log('paymentInfo recibido:', paymentInfo);

      const preapprovalId =
        paymentInfo.preapproval_id ||
        paymentInfo.subscription_id ||
        paymentInfo.point_of_interaction?.transaction_data?.subscription_id;

      if (!preapprovalId) {
        console.log('⚠️ No preapprovalId en el pago.');
        return res.status(200).send('Sin preapprovalId');
      }

      const result = await pool.query('SELECT * FROM ventas WHERE preapproval_id = $1', [preapprovalId]);
      const venta = result.rows[0];

      if (!venta) {
        console.warn(` No se encontró venta pendiente para ${preapprovalId}`);
        return res.status(200).send('Venta no encontrada');
      }

      if (venta.estado === 'procesada') {
        console.log(`ℹ Venta ${preapprovalId} ya estaba procesada`);
        return res.status(200).send('Ya procesada');
      }

      if (paymentInfo.status === 'approved') {
        const reqMock = {
          body: {
            nombrePaquete: venta.nombre_paquete,
            resumenServicios: venta.resumen_servicios,
            monto: venta.monto,
            tipoSuscripcion: venta.tipo_suscripcion,
            fecha: venta.fecha,
            clienteEmail: venta.cliente_email,
            mensajeContinuar: venta.mensaje_continuar
          }
        };
        const resMock = { status: () => ({ json: () => {} }) };

        await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
        await emailController.sendPaymentConfirmationToClient(reqMock, resMock);

        await pool.query(
          'UPDATE ventas SET estado = $1 WHERE preapproval_id = $2',
          ['procesada', preapprovalId]
        );

        console.log(` Venta confirmada y correos enviados: ${preapprovalId}`);
      } else {
        
        const detalleRechazo = paymentInfo.status_detail || 'Motivo no disponible';
        console.warn(`Pago rechazado para ${preapprovalId}`);
        console.warn(` Detalle del rechazo: ${detalleRechazo}`);

        await pool.query(
          'UPDATE ventas SET estado = $1, mensaje_continuar = $2 WHERE preapproval_id = $3',
          ['rechazada', `Pago rechazado: ${detalleRechazo}`, preapprovalId]
        );
      }

      return res.status(200).send('Webhook procesado');
    }

    if (topic === 'preapproval' && action === 'authorized') {
      console.log('📥 Autorización preapproval recibida');
      return res.status(200).send('Autorizado');
    }

    return res.status(200).send('Evento ignorado');
  } catch (error) {
    console.error('Error en webhook:', error);
    return res.status(500).send('Error interno');
  }
};

module.exports = { webhookSuscripcion };
