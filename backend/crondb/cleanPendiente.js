const cron = require('node-cron');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

cron.schedule('0 5 * * *', async () => {
  console.log('[CRON] Ejecutando limpieza diaria...');
  try {
    await pool.query('CALL CleanPendiente();');
    console.log('[CRON] Limpieza diaria completada correctamente.');
  } catch (error) {
    console.error('[CRON] Error al ejecutar limpieza diaria:', error.message);
  }
});
