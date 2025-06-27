
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'ordenes.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS ordenes (
      preapproval_id TEXT PRIMARY KEY,
      cliente_email TEXT,
      nombre_paquete TEXT,
      resumen_servicios TEXT,
      monto REAL,
      fecha TEXT,
      mensaje_continuar TEXT
    )
  `);
});

module.exports = db;
