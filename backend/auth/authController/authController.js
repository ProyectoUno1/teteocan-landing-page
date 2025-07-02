const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../db');

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
const registerAdmin = async (req, res) => {
  // Aquí va tu lógica de registro
  res.json({ message: 'Registro de admin (dummy)' });
};

module.exports = { 
  loginAdmin, 
  registerAdmin 
};