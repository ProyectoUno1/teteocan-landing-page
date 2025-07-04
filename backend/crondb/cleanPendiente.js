const cron = require('node-cron');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

cron.schedule('*/10 * * * *', async () => {
  console.log('[CRON] Ejecutando limpieza automática cada 10 minutos...');
  try {
    await pool.query('CALL CleanPendiente();');
    console.log('[CRON] Limpieza completada correctamente.');
  } catch (error) {
    console.error('[CRON] Error al ejecutar limpieza:', error.message);
  }
});
