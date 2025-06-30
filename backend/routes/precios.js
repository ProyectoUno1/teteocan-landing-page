const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

router.get('/', (req, res) => {
  const filePath = path.join(__dirname, '../precios.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error leyendo archivo precios:', err);
      return res.status(500).json({ error: 'No se pudo cargar el archivo de precios' });
    }

    try {
      const precios = JSON.parse(data);
      res.json(precios);
    } catch (parseErr) {
      console.error('Error parseando JSON de precios:', parseErr);
      res.status(500).json({ error: 'Error al procesar los precios' });
    }
  });
});

module.exports = router;
