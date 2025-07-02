const express = require('express');
const router = express.Router();
const { exportarVentasDesdeDB } = require('../controllers/exportGoogleController');
const { verifyToken } = require('../auth/middlewares/authMiddleware'); // importa el middleware

const SPREADSHEET_ID = '1DH89Ou6xb0ucO0ZMTNdrGXOet08N-RrvnmJeHE5QKjA'; 
const SHEET_NAME = 'Suscripciones';

router.get('/exportar-ventas', verifyToken, async (req, res) => {
  try {
    await exportarVentasDesdeDB(SPREADSHEET_ID, SHEET_NAME);
    res.send('Exportación de ventas completada correctamente.');
  } catch (error) {
    res.status(500).send('Error al exportar ventas: ' + error.message);
  }
});

module.exports = router;
