const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../db');

const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar admin en NEON Postgres
    const adminQuery = await pool.query(
      'SELECT * FROM admins WHERE email = $1',
      [email]
    );

    if (adminQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const admin = adminQuery.rows[0];

    // 2. Verificar contraseña
    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Generar JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 4. Responder con token
    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { loginAdmin };