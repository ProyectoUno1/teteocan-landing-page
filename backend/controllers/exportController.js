const fetch = require('node-fetch'); 
const pool = require('../db'); 

const exportarVentasAGoogleSheets = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ventas ORDER BY fecha DESC');
    const ventas = result.rows;

    const response = await fetch('https://script.google.com/macros/s/AKfycbyLiVYLD9UIkUmrPsS0W_359Z_sZ7zpJy-GAqepN1Z3-5fpkqQ0XtL5U_KT_yqM3NTE/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ventas)
    });

    if (!response.ok) throw new Error('Error al enviar datos a Google Sheets');

    const data = await response.text(); // <- Importante
    console.log('Respuesta Google Sheets:', data);

    res.status(200).json({ 
      message: 'Ventas exportadas correctamente a Google Sheets.',
      googleResponse: data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al exportar ventas.' });
  }
};

module.exports = { exportarVentasAGoogleSheets };
