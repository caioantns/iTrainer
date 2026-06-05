const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { sendMail } = require('../services/mailer');
const { audit } = require('../services/audit');

const TOKEN_TTL_MIN = 30;
const BCRYPT_ROUNDS = 12;
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

function hashToken(plain) {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

async function findUser(email) {
  const lower = String(email).toLowerCase();
  const cli = await pool.query('SELECT cliente_id AS id, nome FROM clientes WHERE email = $1 LIMIT 1', [lower]);
  if (cli.rowCount > 0) return { id: cli.rows[0].id, nome: cli.rows[0].nome, tipo: 'cliente' };
  const prof = await pool.query('SELECT profissional_id AS id, nome FROM profissionais WHERE email = $1 LIMIT 1', [lower]);
  if (prof.rowCount > 0) return { id: prof.rows[0].id, nome: prof.rows[0].nome, tipo: 'profissional' };
  return null;
}

// POST /api/forgot-password { email }
// Sempre retorna 200 ainda que email nao exista (anti-enum)
router.post('/forgot-password', async (req, res, next) => {
  const { email } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email obrigatorio.' });
  }
  try {
    const user = await findUser(email);
    if (user) {
      const plain = crypto.randomBytes(32).toString('base64url');
      const tokenHash = hashToken(plain);
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000);
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, user_tipo, token_hash, expires_at, ip)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, user.tipo, tokenHash, expiresAt, req.ip || null]
      );

      const link = `${APP_BASE_URL}/reset-password?token=${encodeURIComponent(plain)}`;
      const text = `Olá ${user.nome},\n\nVocê (ou alguém) solicitou redefinição de senha.\n\nAbra o link abaixo (válido por ${TOKEN_TTL_MIN} minutos):\n${link}\n\nSe não foi você, ignore esta mensagem.\n\n— iTrainer`;
      try {
        await sendMail({ to: email, subject: 'Redefinição de senha — iTrainer', text });
      } catch (mailErr) {
        console.warn('[forgot-password] envio falhou:', mailErr.message);
      }
      await audit({ req, userId: user.id, userTipo: user.tipo, action: 'password_reset.requested' });
    } else {
      // Mesmo delay/ack p/ nao revelar existencia
      await audit({ req, action: 'password_reset.requested_unknown', target: email.toLowerCase() });
    }

    return res.json({ ok: true, message: 'Se o email estiver cadastrado, enviaremos instruções.' });
  } catch (e) { next(e); }
});

// POST /api/reset-password { token, senha }
router.post('/reset-password', async (req, res, next) => {
  const { token, senha } = req.body || {};
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'Token obrigatorio.' });
  if (!senha || typeof senha !== 'string' || senha.length < 8 || senha.length > 128) {
    return res.status(400).json({ error: 'Senha deve ter entre 8 e 128 caracteres.' });
  }

  try {
    const tokenHash = hashToken(token);
    const r = await pool.query(
      `SELECT token_id, user_id, user_tipo, expires_at, used_at
       FROM password_reset_tokens WHERE token_hash = $1 LIMIT 1`,
      [tokenHash]
    );
    if (r.rowCount === 0) return res.status(400).json({ error: 'Token invalido ou expirado.' });
    const row = r.rows[0];
    if (row.used_at) return res.status(400).json({ error: 'Token ja utilizado.' });
    if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'Token expirado.' });

    const hash = await bcrypt.hash(senha, BCRYPT_ROUNDS);
    const table = row.user_tipo === 'cliente' ? 'clientes' : 'profissionais';
    const idCol = row.user_tipo === 'cliente' ? 'cliente_id' : 'profissional_id';

    await pool.query(`UPDATE ${table} SET senha = $1 WHERE ${idCol} = $2`, [hash, row.user_id]);
    await pool.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE token_id = $1`, [row.token_id]);

    // Revogar refresh tokens existentes p/ forcar relogin pos-reset
    await pool.query(
      `UPDATE refresh_tokens SET revoked_at = NOW()
       WHERE user_id = $1 AND user_tipo = $2 AND revoked_at IS NULL`,
      [row.user_id, row.user_tipo]
    );

    await audit({ req, userId: row.user_id, userTipo: row.user_tipo, action: 'password_reset.completed' });
    res.json({ ok: true, message: 'Senha redefinida. Faca login com a nova senha.' });
  } catch (e) { next(e); }
});

module.exports = router;
