const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configurar transporte SMTP con variables de entorno
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_PORT === '465', // true si puerto 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Ruta POST para recibir datos del formulario y enviar email
router.post('/', async (req, res) => {
  try {
    const { nombre, email, mensaje } = req.body;

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ message: 'Por favor completa todos los campos' });
    }

    // Contenido del email que recibirás
    const mailOptions = {
      from: `"Formulario Contacto" <${process.env.EMAIL_USER}>`, // Remitente
      to: process.env.EMPRESA_EMAIL, // Destino: correo de la empresa
      subject: `Nuevo mensaje desde formulario de contacto de ${nombre}`,
      text: `
      Nombre: ${nombre}
      Email: ${email}
      Mensaje:
      ${mensaje}
      `,
      html: `
        <h2>Nuevo mensaje desde formulario de contacto</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensaje:</strong><br>${mensaje.replace(/\n/g, '<br>')}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'Correo enviado correctamente' });

  } catch (error) {
    console.error('Error enviando correo:', error);
    return res.status(500).json({ message: 'Error al enviar el correo' });
  }
});

module.exports = router;
