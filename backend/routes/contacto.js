const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
  const { nombre, email, mensaje } = req.body;

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ message: 'Faltan datos requeridos.' });
  }

  try {
    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Formulario Tlatec" <${process.env.EMAIL_USER}>`,
      to: process.env.EMPRESA_EMAIL,
      subject: `Consulta desde la página: ${nombre}`,
      text: `Nombre: ${nombre}\nCorreo: ${email}\nMensaje:\n${mensaje}`,
      html: `<p><strong>Nombre:</strong> ${nombre}</p>
             <p><strong>Correo:</strong> ${email}</p>
             <p><strong>Mensaje:</strong><br>${mensaje.replace(/\n/g, '<br>')}</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Correo enviado correctamente.' });
  } catch (error) {
    console.error('Error enviando correo:', error);
    res.status(500).json({ message: 'Error enviando correo.' });
  }
});

module.exports = router;
