const pool = require('../db');
const emailController = require('../pdf/controllers/emailController');

const registrarOrdenGratuita = async (req, res) => {
    const { orderData } = req.body;

    if (!orderData?.preapproval_id || !orderData?.clienteEmail) {
        return res.status(400).json({ message: 'Datos incompletos' });
    }

    try {
        // Inserta la orden con estado = 'pendiente'
        await pool.query(`
            INSERT INTO ventas (
                preapproval_id,
                cliente_email,
                nombre_paquete,
                resumen_servicios,
                monto,
                fecha,
                mensaje_continuar,
                estado
            ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
        `, [
            orderData.preapproval_id,
            orderData.clienteEmail,
            orderData.nombrePaquete,
            orderData.resumenServicios,
            orderData.monto,
            orderData.mensajeContinuar,
            'pendiente' // Estado inicial
        ]);

        const reqMock = { body: orderData };
        const resMock = { status: () => ({ json: () => {} }) };

        await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
        await emailController.sendPaymentConfirmationToClient(reqMock, resMock);

        return res.status(200).json({ message: 'Orden gratuita registrada y correos enviados' });

    } catch (err) {
        console.error('Error al guardar orden gratuita:', err);
        return res.status(500).json({ message: 'Error al registrar orden gratuita' });
    }
};

module.exports = { registrarOrdenGratuita };
