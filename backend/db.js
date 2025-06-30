const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// define la ruta absoluta donde estará la base de datos SQLite
const dbPath = path.join(__dirname, 'ordenes.db');

// crea o abre la base de datos SQLite en la ruta indicada
const db = new sqlite3.Database(dbPath);

// ejecuta las sentencias en serie para evitar problemas de concurrencia
db.serialize(() => {
  // cea la tabla 'ordenes' si no existe con sus columnas y tipos 
  db.run(`
    CREATE TABLE IF NOT EXISTS ordenes (
      preapproval_id TEXT PRIMARY KEY,         // ID único de la suscripción/preaprobación
      cliente_email TEXT,                      // Email del cliente que hizo la orden
      nombre_paquete TEXT,                     // Nombre del paquete contratado
      resumen_servicios TEXT,                  // Resumen de servicios incluidos
      monto REAL,                              // Monto total de la suscripción
      fecha TEXT,                              // Fecha de creación de la orden
      mensaje_continuar TEXT                   // Mensaje personalizado para continuar
    )
  `);
});

// exporta la instancia para usarla en otros módulos (controladores, rutas, etc.)
module.exports = db;
