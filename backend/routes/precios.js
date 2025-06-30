// backend/routes/precios.js
const express = require('express');
const router = express.Router();

const precios = {
  explorador: 0,
  impulso: 299,
  dominio: 359,
  titan: 399
};

router.get('/', (req, res) => {
  res.json(precios);
});

module.exports = router;