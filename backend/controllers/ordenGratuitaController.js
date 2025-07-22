const pool = require('../db');
const emailController = require('../pdf/controllers/emailController');

const ordenGratuita = async (req, res) => {
  try {
    const { orderData } = req.body;
    const {
      stripe_session_id,
      clienteEmail,
      clienteTelefono,
      nombrePaquete,
      resumenServicios,
      monto,
      fecha,
      mensajeContinuar,
      tipoSuscripcion
    } = orderData;

    // Validar límite de 10 órdenes gratuitas usando stripe_session_id que empiece con 'free-'
    if (stripe_session_id && stripe_session_id.startsWith('free-')) {
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM ventas WHERE stripe_session_id LIKE 'free-%'`
      );
      const ventaCount = parseInt(countResult.rows[0].count);

      if (ventaCount >= 10) {
        return res.status(403).json({
          message: 'Límite alcanzado: solo se permiten 10 órdenes gratuitas.'
        });
      }
    }

    
    const fechaValida = new Date(fecha);

    await pool.query(`
      INSERT INTO ventas (
        stripe_session_id,
        cliente_email,
        clienteTelefono,
        nombre_paquete,
        resumen_servicios,
        monto,
        fecha,
        mensaje_continuar,
        tipo_suscripcion,
        estado
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'procesada')
    `, [
      stripe_session_id,
      clienteEmail,
      clienteTelefono,
      nombrePaquete,
      resumenServicios,
      monto,
      fechaValida, // usamos la fecha convertida
      mensajeContinuar,
      tipoSuscripcion || null
    ]);


    // Enviar correos
    const reqMock = { body: orderData };
    const resMock = { status: () => ({ json: () => { } }) };

    await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
    await emailController.sendPaymentConfirmationToClient(reqMock, resMock);

    res.status(200).json({ message: 'Orden gratuita registrada correctamente' });
  } catch (error) {
    console.error('Error en orden gratuita:', error);
    res.status(500).json({ message: 'Error al registrar orden gratuita' });
  }
};

module.exports = { ordenGratuita };
