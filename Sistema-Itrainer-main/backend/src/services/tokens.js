const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const {
  JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE, JWT_EXPIRES_IN,
  REFRESH_TOKEN_TTL_DAYS, isProd, COOKIE_DOMAIN,
} = require('../config');

const REFRESH_COOKIE = 'itrainer_rt';

function signAccess({ id, tipo }) {
  return jwt.sign(
    { sub: String(id), tipo },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  );
}

function verifyAccess(token) {
  return jwt.verify(token, JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

// Refresh: token opaco (random) + hash em DB. Plain so cliente conhece.
function generateRefreshPlain() {
  return crypto.randomBytes(48).toString('base64url');
}
function hashRefresh(plain) {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

async function issueRefresh({ userId, tipo, familyId, ip, userAgent }) {
  const plain = generateRefreshPlain();
  const tokenHash = hashRefresh(plain);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 3600 * 1000);
  const fam = familyId || crypto.randomUUID();
  const r = await pool.query(
    `INSERT INTO refresh_tokens (family_id, user_id, user_tipo, token_hash, expires_at, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING token_id, family_id`,
    [fam, userId, tipo, tokenHash, expiresAt, ip || null, userAgent || null]
  );
  return { plain, tokenId: r.rows[0].token_id, familyId: r.rows[0].family_id, expiresAt };
}

// Rotate: valida, marca old revoked, emite novo. Detecta reuse -> revoga family inteira.
async function rotateRefresh({ plain, ip, userAgent }) {
  const tokenHash = hashRefresh(plain);
  const r = await pool.query(
    `SELECT token_id, family_id, user_id, user_tipo, expires_at, revoked_at, replaced_by
     FROM refresh_tokens WHERE token_hash = $1 LIMIT 1`,
    [tokenHash]
  );
  if (r.rowCount === 0) {
    const err = new Error('refresh invalido');
    err.status = 401;
    throw err;
  }
  const row = r.rows[0];

  // Reuse detected: token ja revogado/substituido -> revoga toda family.
  if (row.revoked_at || row.replaced_by) {
    await pool.query(
      `UPDATE refresh_tokens SET revoked_at = NOW()
       WHERE family_id = $1 AND revoked_at IS NULL`,
      [row.family_id]
    );
    const err = new Error('refresh reuse detectado: sessao revogada');
    err.status = 401;
    throw err;
  }

  if (new Date(row.expires_at) < new Date()) {
    const err = new Error('refresh expirado');
    err.status = 401;
    throw err;
  }

  // Emite novo + marca old como replaced.
  const novo = await issueRefresh({
    userId: row.user_id,
    tipo: row.user_tipo,
    familyId: row.family_id,
    ip, userAgent,
  });
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW(), replaced_by = $1
     WHERE token_id = $2`,
    [novo.tokenId, row.token_id]
  );
  return {
    plain: novo.plain,
    user: { id: row.user_id, tipo: row.user_tipo },
    expiresAt: novo.expiresAt,
  };
}

async function revokeRefresh(plain) {
  if (!plain) return;
  const tokenHash = hashRefresh(plain);
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash]
  );
}

async function revokeFamilyByPlain(plain) {
  if (!plain) return;
  const tokenHash = hashRefresh(plain);
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE family_id = (SELECT family_id FROM refresh_tokens WHERE token_hash = $1 LIMIT 1)
       AND revoked_at IS NULL`,
    [tokenHash]
  );
}

function setRefreshCookie(res, plain, expiresAt) {
  res.cookie(REFRESH_COOKIE, plain, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/api',
    expires: expiresAt,
    domain: COOKIE_DOMAIN,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/api',
    domain: COOKIE_DOMAIN,
  });
}

module.exports = {
  REFRESH_COOKIE,
  signAccess,
  verifyAccess,
  issueRefresh,
  rotateRefresh,
  revokeRefresh,
  revokeFamilyByPlain,
  setRefreshCookie,
  clearRefreshCookie,
};
