const express = require('express');
const router = express.Router();
const emailController = require('../pdf/controllers/emailController');

router.post('/', async (req, res) => {
    try {
        const mpNotification = req.body;

        // Aquí puedes imprimir para pruebas
        console.log('Webhook recibido:', JSON.stringify(mpNotification, null, 2));

        // Ejemplo para suscripción aprobada (ajusta según lo que te mande Mercado Pago)
        if (
            mpNotification.type === 'preapproval' &&
            mpNotification.action === 'authorized'
        ) {
            const orderData = {
                nombrePaquete: mpNotification.data.reason || 'Paquete sin nombre',
                resumenServicios: 'Servicios incluidos no especificados',
                monto: mpNotification.data.auto_recurring?.transaction_amount || 0,
                fecha: new Date().toLocaleDateString('es-MX'),
                clienteEmail: mpNotification.data.payer_email || 'cliente@example.com',
                mensajeContinuar: "Gracias por tu suscripción. Pronto nos pondremos en contacto contigo."
            };

            const reqMock = { body: orderData };
            const resMock = {
                status: () => ({ json: () => {} })
            };

            // Enviar correos
            await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
            await emailController.sendPaymentConfirmationToClient(reqMock, resMock);

            return res.status(200).send('Webhook recibido y correos enviados.');
        }

        return res.status(200).send('Evento no relevante.');
    } catch (error) {
        console.error('Error procesando webhook:', error);
        return res.status(500).send('Error interno del servidor');
    }
});

module.exports = router;
