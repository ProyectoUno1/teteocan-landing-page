const nodemailer = require('nodemailer');
const pdf = require('pdf-creator-node');
const path = require('path');
const fs = require('fs');

// Configuración del transportador de correo
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true para 465, false para otros puertos (como 587)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Genera un PDF a partir de un HTML template.
 * @param {object} data Datos para rellenar el template.
 * @param {string} templatePath Ruta al archivo HTML del template.
 * @returns {Promise<Buffer>} Buffer del PDF generado.
 */
async function generatePdf(data, templatePath) {
    try {
        // Leer el template HTML
        const html = fs.readFileSync(templatePath, 'utf8');

        // URL pública del logo (hosted en github)
       const logoUrl = 'https://raw.githubusercontent.com/ProyectoUno1/teteocan-landing-page/main/docs/assets/images/LogoTlatec.png';


        const templateData = {
            ...data,
            logoUrl
        };

        const options = {
            format: 'Letter',
            orientation: 'portrait',
            border: '10mm',
            header: {
                height: '10mm',
                contents: '<div style="text-align: center;">Este es un producto de Teteocan Technologies</div>'
            },
            footer: {
                height: '10mm',
                contents: {
                    first: '<span>Página {{page}} de {{pages}}</span>',
                    2: '<span>Página {{page}} de {{pages}}</span>',
                    default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>'
                }
            }
        };

        const document = {
            html: html,
            data: templateData,
            path: '', // Devuelve el buffer directamente
            type: 'buffer',
        };

        const pdfBuffer = await pdf.create(document, options);
        return pdfBuffer;
    } catch (error) {
        console.error('Error generando PDF:', error);
        throw new Error('No se pudo generar el PDF.');
    }
}

/**
 * Envía un correo electrónico con un PDF adjunto.
 * @param {string} to Dirección de correo del destinatario.
 * @param {string} subject Asunto del correo.
 * @param {string} text Cuerpo del correo en texto plano.
 * @param {string} html Cuerpo del correo en HTML.
 * @param {Buffer} pdfBuffer Buffer del archivo PDF a adjuntar.
 * @param {string} pdfFilename Nombre del archivo PDF.
 */
async function sendEmailWithPdf(to, subject, text, html, pdfBuffer, pdfFilename) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            text: text,
            html: html,
            attachments: [{
                filename: pdfFilename,
                content: pdfBuffer,
                contentType: 'application/pdf',
            }],
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo enviado a ${to} con el PDF: ${pdfFilename}`);
    } catch (error) {
        console.error(`Error enviando correo a ${to}:`, error);
        throw new Error('No se pudo enviar el correo.');
    }
}

module.exports = {
    generatePdf,
    sendEmailWithPdf,
};
