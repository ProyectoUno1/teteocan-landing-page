const fetch = require('node-fetch'); 
const pool = require('../db'); 

const exportarVentasAGoogleSheets = async (req, res) => {
  try {
    // 1. Obtener las ventas
    const result = await pool.query('SELECT * FROM ventas ORDER BY fecha DESC');
    const ventas = result.rows;

    // 2. Enviar al Google Apps Script (Web App)
    const response = await fetch('https://script.google.com/macros/s/AKfycbyPEySKkQsqjnxauU6vz1u7yFcXWjCdPG4m96_Ts7JRMovAqlE3fs8ysbXToRstp3Wh/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ventas)
    });

    const text = await response.text();

    if (!response.ok || !text.includes("Datos recibidos correctamente")) {
      throw new Error(`Respuesta no válida de Google Sheets: ${text}`);
    }

    // 3. Responder al cliente
    res.status(200).json({ 
      message: 'Ventas exportadas correctamente a Google Sheets.',
      googleResponse: text
    });
  } catch (error) {
    console.error('Error exportando a Google Sheets:', error.message);
    res.status(500).json({ message: 'Error al exportar ventas.', error: error.message });
  }
};

module.exports = { exportarVentasAGoogleSheets };

