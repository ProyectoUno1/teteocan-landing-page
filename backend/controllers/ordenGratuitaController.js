const pool = require('../db');
const emailController = require('../pdf/controllers/emailController');

const ordenGratuita = async (req, res) => {
    try {
        const { orderData } = req.body;
        const {
            preapproval_id,
            clienteEmail,
            nombrePaquete,
            resumenServicios,
            monto,
            fecha,
            mensajeContinuar
        } = orderData;

        // Guarda la orden en la base de datos
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
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,'pendiente')
        `, [
            preapproval_id,
            clienteEmail,
            nombrePaquete,
            resumenServicios,
            monto,
            fecha,
            mensajeContinuar
        ]);

        // Simula envío de correos
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
