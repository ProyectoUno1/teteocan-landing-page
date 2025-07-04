const cron = require('node-cron');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

cron.schedule('* * * * *', async () => {
  console.log('[CRON] Ejecutando limpieza automática...');

  try {
    await pool.query('CALL CleanPendiente();');
    console.log('[CRON] Limpieza completada correctamente.');
  } catch (error) {
    console.error('[CRON] Error al ejecutar limpieza:', error.message);
  }
});
