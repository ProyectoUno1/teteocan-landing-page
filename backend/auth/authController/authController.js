const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../db');

// Función para manejar el login de un administrador
// Esta función verifica las credenciales del administrador y genera un JWT si son válidas
const loginAdmin = async (req, res) => {
  // Validación básica del request
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  const { email, password } = req.body;
  console.log(`Intento de login para: ${email}`); // Log de depuración

  try {
    // 1. Buscar admin en NEON Postgres (con trim() para limpiar espacios)
    const adminQuery = await pool.query(
      'SELECT id, email, password_hash, name FROM admins WHERE email = $1', 
      [email.trim()]
    );

    if (adminQuery.rows.length === 0) {
      console.log('⚠️ Admin no encontrado en DB'); // Log importante
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const admin = adminQuery.rows[0];
    console.log('Hash almacenado:', admin.password_hash); // Log crítico

    // 2. Verificar contraseña (con trim() para seguridad)
    const validPassword = await bcrypt.compare(password.trim(), admin.password_hash);
    console.log('Resultado comparación:', validPassword); // Log esencial

    if (!validPassword) {
      console.log('❌ Contraseña no coincide'); // 
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Generar JWT token (verifica que JWT_SECRET exista en Render)
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no configurado');
    }

    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email,
        name: admin.name //
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 4. Responder (ocultamos el hash por seguridad)
    const { password_hash, ...adminData } = admin;
    res.json({
      token,
      admin: adminData
    });

  } catch (error) {
    console.error('🔥 Error en login:', error.message); // Log detallado
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Función para manejar el registro de un nuevo administrador
// Esta función verifica si el email ya existe, hashea la contraseña y guarda el nuevo admin
const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    // Verifica si el email ya existe
    const existing = await pool.query('SELECT id FROM admins WHERE email = $1', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    // Hashea la contraseña
    const password_hash = await bcrypt.hash(password.trim(), 10);

    // Inserta el nuevo admin
    const result = await pool.query(
      'INSERT INTO admins (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name.trim(), email.trim(), password_hash]
    );

    res.status(201).json({ admin: result.rows[0] });
  } catch (error) {
    console.error('Error en registro:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Función para manejar la recuperación de contraseña
// Esta función envía un correo con un enlace para restablecer la contraseña
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    console.warn('[forgotPassword] Solicitud sin correo');
    return res.status(400).json({ error: 'Correo requerido' });
  }

  try {
    const userResult = await pool.query('SELECT id, email FROM admins WHERE email = $1', [email.trim()]);
    if (userResult.rows.length > 0) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

      await pool.query(
        'INSERT INTO password_resets (admin_id, token, expires_at) VALUES ($1, $2, $3)',
        [userResult.rows[0].id, token, expires]
      );
      console.log(`[forgotPassword] Token generado para admin_id=${userResult.rows[0].id}, email=${email}, token=${token}`);

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const resetUrl = `https://proyectouno1.github.io/teteocan-landing-page/login-admin/resetPassword.html?token=${token}`;
      await transporter.sendMail({
        from: '"Tlatec" <no-reply@teteocan.com>',
        to: email,
        subject: 'Recupera tu contraseña',
        html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
               <a href="${resetUrl}">${resetUrl}</a>
               <p>Este enlace expirará en 1 hora.</p>`
      });
      console.log(`[forgotPassword] Correo de recuperación enviado a ${email}`);
    } else {
      console.warn(`[forgotPassword] Solicitud para correo NO registrado: ${email}`);
    }
    res.json({ message: 'Si el correo está registrado, te hemos enviado un enlace para restablecer tu contraseña.' });
  } catch (error) {
    console.error('[forgotPassword] Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Función para manejar el restablecimiento de contraseña
// Esta función verifica el token, actualiza la contraseña y elimina el token usado
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    console.warn('[resetPassword] Faltan token o contraseña');
    return res.status(400).json({ error: 'Token y nueva contraseña requeridos.' });
  }
  try {
    const result = await pool.query(
      'SELECT admin_id, expires_at FROM password_resets WHERE token = $1',
      [token]
    );
    if (result.rows.length === 0) {
      console.warn(`[resetPassword] Token no encontrado: ${token}`);
      return res.status(400).json({ error: 'Token inválido o expirado.' });
    }
    if (new Date(result.rows[0].expires_at) < new Date()) {
      console.warn(`[resetPassword] Token expirado para admin_id=${result.rows[0].admin_id}`);
      return res.status(400).json({ error: 'Token inválido o expirado.' });
    }
    const adminId = result.rows[0].admin_id;

    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE admins SET password_hash = $1 WHERE id = $2',
      [password_hash, adminId]
    );
    console.log(`[resetPassword] Contraseña actualizada para admin_id=${adminId}`);

    await pool.query('DELETE FROM password_resets WHERE token = $1', [token]);
    console.log(`[resetPassword] Token eliminado: ${token}`);

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('[resetPassword] Error:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Exportar las funciones para usarlas en las rutas
module.exports = { 
  loginAdmin, 
  registerAdmin,
  forgotPassword,
  resetPassword 
};