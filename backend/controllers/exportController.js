const pool = require('../db');
const XLSX = require('xlsx');

const exportarVentasAExcel = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ventas ORDER BY fecha DESC');
    const ventas = result.rows;

    // Crear worksheet desde JSON
    const worksheet = XLSX.utils.json_to_sheet(ventas);

    // Crear workbook y agregar la hoja
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas');

    // Generar buffer Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Enviar archivo para descarga
    res.setHeader('Content-Disposition', 'attachment; filename="ventas.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(excelBuffer);

  } catch (error) {
    console.error('Error exportando ventas a Excel:', error);
    res.status(500).json({ message: 'Error al exportar ventas a Excel' });
  }
};

module.exports = { exportarVentasAExcel };
