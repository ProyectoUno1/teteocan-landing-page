const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// ruta GET para obtener el contenido de precios.json
router.get('/', (req, res) => {
  // construye la ruta absoluta al archivo precios.json
  const filePath = path.join(__dirname, '../precios.json');

  // lee el archivo precios.json de forma asíncrona
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      // si ocurre un error al leer el archivo, se muestra en consola y se responde con error 500
      console.error('Error leyendo archivo precios:', err);
      return res.status(500).json({ error: 'No se pudo cargar el archivo de precios' });
    }

    try {
      // intenta convertir el contenido del archivo (string) a objeto JSON
      const precios = JSON.parse(data);

      // si el parseo es exitoso, se responde con el objeto JSON de precios
      res.json(precios);
    } catch (parseErr) {
      // si ocurre un error al convertir a JSON, se muestra en consola y se responde con error 500
      console.error('Error parseando JSON de precios:', parseErr);
      res.status(500).json({ error: 'Error al procesar los precios' });
    }
  });
});


module.exports = router;
