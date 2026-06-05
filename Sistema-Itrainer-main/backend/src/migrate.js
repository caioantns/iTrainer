const fs = require('fs');
const path = require('path');
const { pool, withTransaction } = require('./db');

// Diagnostico: confirma config que pg pool usa
function dumpDbConfig() {
  const url = process.env.DATABASE_URL;
  if (url) {
    // Mascara senha p/ log seguro
    const masked = url.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1***$3');
    console.log(`[migrate] DATABASE_URL raw=${masked}`);
    console.log(`[migrate] DATABASE_URL length=${url.length}`);
    try {
      const u = new URL(url);
      console.log(`[migrate] parsed host=${u.hostname} port=${u.port || '5432'} db=${u.pathname.slice(1)} user=${u.username}`);
    } catch (e) {
      console.log(`[migrate] new URL() failed: ${e.message}`);
    }
  } else {
    console.log('[migrate] DATABASE_URL ausente.');
  }
  console.log(`[migrate] PGHOST=${process.env.PGHOST || '(unset)'} PGPORT=${process.env.PGPORT || '(unset)'} PGDATABASE=${process.env.PGDATABASE || '(unset)'} PGUSER=${process.env.PGUSER || '(unset)'}`);
}

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getApplied() {
  const r = await pool.query('SELECT filename FROM schema_migrations');
  return new Set(r.rows.map((row) => row.filename));
}

async function run() {
  dumpDbConfig();
  try {
    await ensureMigrationsTable();
    const applied = await getApplied();

    const dir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`SKIP (já aplicada): ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      console.log(`Aplicando migration: ${file}`);
      await withTransaction(async (client) => {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      });
      console.log(`OK: ${file}`);
    }

    console.log('Migrations concluídas.');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Falha em migrations.');
    console.error('  message :', err.message || '(sem mensagem)');
    console.error('  code    :', err.code || '(sem code)');
    console.error('  detail  :', err.detail || '');
    console.error('  hint    :', err.hint || '');
    console.error('  stack   :', err.stack || '');
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

run();
