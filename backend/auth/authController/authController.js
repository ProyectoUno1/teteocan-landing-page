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

module.exports = { 
  loginAdmin, 
  registerAdmin 
};