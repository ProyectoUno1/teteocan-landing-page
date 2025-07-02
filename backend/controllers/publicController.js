
const pool = require('../db');

const verificarEstadoExplorador = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) 
      FROM ventas 
      WHERE preapproval_id LIKE 'free-%'
    `);

    const total = parseInt(result.rows[0].count, 10);
    const LIMITE = 10;
    const soldOut = total >= LIMITE;
    const restantes = soldOut ? 0 : LIMITE - total;

    res.json({ soldOut, restantes });
  } catch (error) {
    console.error('Error al verificar estado del paquete explorador:', error);
    res.status(500).json({ error: 'Error al verificar estado' });
  }
};

module.exports = { verificarEstadoExplorador };
