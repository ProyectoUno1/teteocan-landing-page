const pool = require('../db');
const emailController = require('../pdf/controllers/emailController'); // Controlador emails

const obtenerVentas = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ventas ORDER BY fecha DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ message: 'Error al obtener ventas' });
  }
};

const registrarVentaManual = async (req, res) => {
  const {
    cliente_email,
    nombre_paquete,
    resumen_servicios,
    monto,
    fecha,
    mensaje_continuar = 'Registro manual desde el panel administrador',
    tipo_suscripcion
     
    
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO ventas 
        (cliente_email, nombre_paquete, resumen_servicios, monto, fecha, estado, mensaje_continuar,tipo_suscripcion)
       VALUES 
        ($1, $2, $3, $4, $5, 'manual', $6, $7)`,
      [cliente_email, nombre_paquete, resumen_servicios, monto, fecha, mensaje_continuar,tipo_suscripcion]
    );

    const reqMock = {
      body: {
        clienteEmail: cliente_email,
        nombrePaquete: nombre_paquete,
        resumenServicios: resumen_servicios,
        monto,
        tipoSuscripcion: tipo_suscripcion,
        fecha,
        mensajeContinuar: mensaje_continuar,
      },
    };
    const resMock = { status: () => ({ json: () => {} }) };

    await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
    await emailController.sendPaymentConfirmationToClient(reqMock, resMock);

    res.status(200).json({ message: 'Venta registrada y correos enviados con éxito' });
  } catch (error) {
    console.error('Error al registrar venta manual:', error);
    res.status(500).json({ message: 'Error al registrar venta manual' });
  }
};

const borrarTodasLasVentas = async (req, res) => {
  try {
    await pool.query('DELETE FROM ventas');  // borrar todos los registros
    res.status(200).json({ message: 'Ventas borradas correctamente.' });
  } catch (error) {
    console.error('Error borrando ventas:', error);
    res.status(500).json({ error: 'Error interno al borrar ventas.' });
  }
};

module.exports = {
  obtenerVentas,
  registrarVentaManual,
  borrarTodasLasVentas
};
