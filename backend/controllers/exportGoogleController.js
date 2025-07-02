const { google } = require('googleapis');
const path = require('path');
const pool = require('../db');

// Carga las credenciales
const auth = new google.auth.GoogleAuth({
  keyFile: '/etc/secrets/serviceCredentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function exportarDatosASheets(dataArray, spreadsheetId, sheetName) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  // Convierte los datos (array de objetos) a filas (array de arrays)
  const encabezados = Object.keys(dataArray[0]);
  const filas = dataArray.map(obj => encabezados.map(k => obj[k]));

  const values = [encabezados, ...filas];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    resource: {
      values,
    },
  });

  console.log('Datos exportados a Google Sheets');
}

async function exportarVentasDesdeDB(spreadsheetId, sheetName) {
  try {
    const resultado = await pool.query(`
      SELECT 
        id,
        cliente_email,
        nombre_paquete,
        tipo_suscripcion,
        monto,
        estado,
        fecha
      FROM ventas
      ORDER BY fecha DESC
    `);

    const datos = resultado.rows;

    if (datos.length === 0) {
      console.log('No hay registros en la tabla ventas.');
      return;
    }

    await exportarDatosASheets(datos, spreadsheetId, sheetName);
  } catch (error) {
    console.error('Error al exportar desde la base de datos:', error);
    throw error;
  }
}

module.exports = { 
  exportarDatosASheets,
  exportarVentasDesdeDB
 };
