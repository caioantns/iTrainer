const { pool } = require('../db');

// Audit log: nunca lanca erro p/ chamador, falha silenciosa em DB-down.
async function audit({ req, userId, userTipo, action, target, meta }) {
  try {
    const ip = req?.ip || null;
    const ua = (req?.headers?.['user-agent'] || '').slice(0, 500) || null;
    const effectiveUserId = userId != null ? userId : (req?.user?.id ?? null);
    const effectiveTipo = userTipo || req?.user?.tipo || null;
    await pool.query(
      `INSERT INTO audit_log (user_id, user_tipo, action, target, meta, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [effectiveUserId, effectiveTipo, action, target || null, meta ? JSON.stringify(meta) : null, ip, ua]
    );
  } catch (err) {
    console.warn('[audit] falha ao gravar:', err.message);
  }
}

module.exports = { audit };
