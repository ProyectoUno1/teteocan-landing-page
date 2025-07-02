const fetch = require('node-fetch'); 
const pool = require('../db'); 


const exportarVentasAGoogleSheets = async (req, res) => {
  try {
    // Obtén las ventas desde la base de datos (asumiendo que tienes pool configurado)
    const result = await pool.query('SELECT * FROM ventas ORDER BY fecha DESC');
    const ventas = result.rows;

    // Enviar datos al Google Apps Script
    const response = await fetch('https://script.google.com/macros/s/AKfycbyPEySKkQsqjnxauU6vz1u7yFcXWjCdPG4m96_Ts7JRMovAqlE3fs8ysbXToRstp3Wh/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ventas)
    });

    if (!response.ok) throw new Error('Error al enviar datos a Google Sheets');

    res.status(200).json({ message: 'Ventas exportadas correctamente a Google Sheets.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al exportar ventas.' });
  }
};


module.exports = { exportarVentasAGoogleSheets };
