const dotenv = require('dotenv');
dotenv.config();

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || 'itrainer_user',
      password: process.env.PGPASSWORD || '',
      database: process.env.PGDATABASE || 'itrainer',
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    });

pool.on('error', (err) => {
  console.error('[pg pool] erro inesperado:', err);
});

async function checkConnection() {
  try {
    await pool.query('SELECT 1');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Rollback automatico se callback lancar.
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, checkConnection, withTransaction };
