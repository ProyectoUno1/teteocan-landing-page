// backend/pdf/controllers/emailController.js
const emailService = require('../services/emailService');
const path = require('path');

/**
 * Envía la confirmación de orden de pago a la empresa.
 * @param {object} req Objeto de la petición HTTP (debe contener body con datos del paquete).
 * @param {object} res Objeto de la respuesta HTTP.
 */
async function sendOrderConfirmationToCompany(req, res) {
    try {
        const { nombrePaquete, resumenServicios, monto, fecha, clienteEmail, tipoSuscripcion } = req.body;

        if (
            !nombrePaquete ||
            !resumenServicios ||
            monto === undefined || monto === null || isNaN(monto) ||
            !fecha
        ) {
            return res.status(400).json({ message: 'Faltan datos para generar la orden de pago.' });
        }

        const data = { nombrePaquete, resumenServicios, monto, fecha, clienteEmail, tipoSuscripcion };
        const templatePath = path.resolve(__dirname, '../templates/empresa.html');
        const pdfBuffer = await emailService.generatePdf(data, templatePath);

        const emailTo = process.env.EMPRESA_EMAIL;
        const subject = `Nueva Orden de Pago - ${nombrePaquete}`;
        const text = `Se ha generado una nueva orden de pago para el paquete: ${nombrePaquete}.\nTipo de suscripción: ${tipoSuscripcion || 'No especificado'}.\nAdjuntamos los detalles en formato PDF.`;
        const html = `<p>Se ha generado una nueva orden de pago para el paquete: <strong>${nombrePaquete}</strong>.</p><p>Tipo de suscripción: <strong>${tipoSuscripcion || 'No especificado'}</strong>.</p><p>Adjuntamos los detalles en formato PDF.</p>`;
        const pdfFilename = `Orden_Pago_${nombrePaquete.replace(/ /g, '_')}_${fecha}.pdf`;

        await emailService.sendEmailWithPdf(emailTo, subject, text, html, pdfBuffer, pdfFilename);

        res.status(200).json({ message: 'Correo de orden de pago enviado a la empresa con éxito.' });
    } catch (error) {
        console.error('Error en sendOrderConfirmationToCompany:', error);
        res.status(500).json({ message: 'Error interno del servidor al enviar correo de orden de pago.', error: error.message });
    }
}

/**
 * Envía la confirmación de pago al cliente.
 * @param {object} req Objeto de la petición HTTP (debe contener body con datos del paquete y email del cliente).
 * @param {object} res Objeto de la respuesta HTTP.
 */
async function sendPaymentConfirmationToClient(req, res) {
    try {
        const { nombrePaquete, resumenServicios, monto, fecha, clienteEmail, mensajeContinuar, tipoSuscripcion } = req.body;

        if (
            !nombrePaquete ||
            !resumenServicios ||
            monto === undefined || monto === null || isNaN(monto) ||
            !fecha ||
            !clienteEmail ||
            !mensajeContinuar
        ) {
            return res.status(400).json({ message: 'Faltan datos para confirmar el pago al cliente.' });
        }

        const data = { nombrePaquete, resumenServicios, monto, fecha, mensajeContinuar, tipoSuscripcion };
        const templatePath = path.resolve(__dirname, '../templates/cliente.html');
        const pdfBuffer = await emailService.generatePdf(data, templatePath);

        const emailTo = clienteEmail;
        const subject = `Confirmación de Compra - ${nombrePaquete}`;
        const text = `¡Gracias por tu compra! Tu paquete "${nombrePaquete}" ha sido confirmado.\nTipo de suscripción: ${tipoSuscripcion || 'No especificado'}.\nAdjuntamos los detalles en formato PDF.\n\n${mensajeContinuar}`;
        const html = `
            <p>¡Gracias por tu compra!</p>
            <p>Tu paquete <strong>${nombrePaquete}</strong> ha sido confirmado.</p>
            <p>Tipo de suscripción: <strong>${tipoSuscripcion || 'No especificado'}</strong></p>
            <p>Adjuntamos los detalles en formato PDF.</p>
            <p><strong>${mensajeContinuar}</strong></p>
        `;
        const pdfFilename = `Confirmacion_Compra_${nombrePaquete.replace(/ /g, '_')}_${fecha}.pdf`;

        await emailService.sendEmailWithPdf(emailTo, subject, text, html, pdfBuffer, pdfFilename);

        res.status(200).json({ message: 'Correo de confirmación de pago enviado al cliente con éxito.' });
    } catch (error) {
        console.error('Error en sendPaymentConfirmationToClient:', error);
        res.status(500).json({ message: 'Error interno del servidor al enviar correo de confirmación de pago.', error: error.message });
    }
}
module.exports = {
    sendOrderConfirmationToCompany,
    sendPaymentConfirmationToClient,
};
