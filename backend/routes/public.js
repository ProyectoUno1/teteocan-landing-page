const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET: Verifica si el paquete explorador está agotado
router.get('/estado-explorador', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM ventas WHERE preapproval_id LIKE 'free-%'`
    );
    const count = parseInt(result.rows[0].count);
    const soldOut = count >= 10;
    res.json({ soldOut });
  } catch (err) {
    console.error('Error al verificar estado del paquete explorador:', err);
    res.status(500).json({ soldOut: false, error: 'Error al consultar estado' });
  }
});

module.exports = router;
