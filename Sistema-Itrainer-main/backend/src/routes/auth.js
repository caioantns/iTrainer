const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const bcrypt = require('bcryptjs');
const {
  signAccess, issueRefresh, rotateRefresh, revokeRefresh,
  setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE,
} = require('../services/tokens');
const { audit } = require('../services/audit');

const BCRYPT_ROUNDS = 12;

function validateRegister({ nome, email, senha }) {
  if (!nome || !email || !senha) return 'Nome, email e senha são obrigatórios.';
  if (typeof nome !== 'string' || nome.length < 2 || nome.length > 100) return 'Nome inválido.';
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) return 'Email inválido.';
  if (typeof senha !== 'string' || senha.length < 8 || senha.length > 128) return 'Senha deve ter entre 8 e 128 caracteres.';
  return null;
}

function reqMeta(req) {
  return {
    ip: req.ip || null,
    userAgent: (req.headers['user-agent'] || '').slice(0, 500),
  };
}

async function emitirSessao(res, req, { id, tipo, nome, email }) {
  const access = signAccess({ id, tipo });
  const meta = reqMeta(req);
  const refresh = await issueRefresh({ userId: id, tipo, ip: meta.ip, userAgent: meta.userAgent });
  setRefreshCookie(res, refresh.plain, refresh.expiresAt);
  return {
    user: { id, nome, email, tipo, type: tipo === 'cliente' ? 'client' : 'professional' },
    accessToken: access,
  };
}

// POST /api/cadastro/clientes
router.post('/cadastro/clientes', async (req, res, next) => {
  const err = validateRegister(req.body || {});
  if (err) return res.status(400).json({ error: err });
  const { nome, email, senha } = req.body;
  try {
    const exists = await pool.query('SELECT cliente_id FROM clientes WHERE email = $1 LIMIT 1', [email.toLowerCase()]);
    if (exists.rowCount > 0) return res.status(409).json({ error: 'Email já cadastrado.' });
    const hash = await bcrypt.hash(senha, BCRYPT_ROUNDS);
    const r = await pool.query(
      `INSERT INTO clientes (nome, email, senha)
       VALUES ($1, $2, $3)
       RETURNING cliente_id, nome, email`,
      [nome, email.toLowerCase(), hash]
    );
    const u = r.rows[0];
    const sess = await emitirSessao(res, req, {
      id: u.cliente_id, tipo: 'cliente', nome: u.nome, email: u.email,
    });
    await audit({ req, userId: u.cliente_id, userTipo: 'cliente', action: 'cadastro.cliente' });
    return res.status(201).json(sess);
  } catch (e) { next(e); }
});

// POST /api/cadastro/profissionais
router.post('/cadastro/profissionais', async (req, res, next) => {
  const err = validateRegister(req.body || {});
  if (err) return res.status(400).json({ error: err });
  const { nome, email, senha } = req.body;
  try {
    const exists = await pool.query('SELECT profissional_id FROM profissionais WHERE email = $1 LIMIT 1', [email.toLowerCase()]);
    if (exists.rowCount > 0) return res.status(409).json({ error: 'Email já cadastrado.' });
    const hash = await bcrypt.hash(senha, BCRYPT_ROUNDS);
    const r = await pool.query(
      `INSERT INTO profissionais (nome, email, senha)
       VALUES ($1, $2, $3)
       RETURNING profissional_id, nome, email`,
      [nome, email.toLowerCase(), hash]
    );
    const u = r.rows[0];
    const sess = await emitirSessao(res, req, {
      id: u.profissional_id, tipo: 'profissional', nome: u.nome, email: u.email,
    });
    await audit({ req, userId: u.profissional_id, userTipo: 'profissional', action: 'cadastro.profissional' });
    return res.status(201).json(sess);
  } catch (e) { next(e); }
});

async function loginHandler(req, res, next, kind) {
  const { email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

  const table = kind === 'cliente' ? 'clientes' : 'profissionais';
  const idCol = kind === 'cliente' ? 'cliente_id' : 'profissional_id';

  try {
    const r = await pool.query(
      `SELECT ${idCol} AS id, nome, email, senha FROM ${table} WHERE email = $1 LIMIT 1`,
      [String(email).toLowerCase()]
    );
    if (r.rowCount === 0) {
      await audit({ req, action: 'login.fail', target: String(email).toLowerCase(), meta: { reason: 'no_user', kind } });
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
    const user = r.rows[0];

    const stored = user.senha || '';
    if (typeof stored !== 'string' || !stored.startsWith('$2')) {
      await audit({ req, userId: user.id, userTipo: kind, action: 'login.fail', meta: { reason: 'bad_hash' } });
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const ok = await bcrypt.compare(senha, stored);
    if (!ok) {
      await audit({ req, userId: user.id, userTipo: kind, action: 'login.fail', meta: { reason: 'wrong_password' } });
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const sess = await emitirSessao(res, req, {
      id: user.id, tipo: kind, nome: user.nome, email: user.email,
    });
    await audit({ req, userId: user.id, userTipo: kind, action: 'login.success' });
    return res.json(sess);
  } catch (e) { next(e); }
}

router.post('/login/clientes', (req, res, next) => loginHandler(req, res, next, 'cliente'));
router.post('/login/profissionais', (req, res, next) => loginHandler(req, res, next, 'profissional'));

// POST /api/refresh — rotaciona refresh cookie + emite novo access
router.post('/refresh', async (req, res, next) => {
  const plain = req.cookies?.[REFRESH_COOKIE];
  if (!plain) return res.status(401).json({ error: 'Sem refresh token.' });
  try {
    const meta = reqMeta(req);
    const result = await rotateRefresh({ plain, ip: meta.ip, userAgent: meta.userAgent });
    setRefreshCookie(res, result.plain, result.expiresAt);
    const access = signAccess({ id: result.user.id, tipo: result.user.tipo });
    return res.json({ accessToken: access });
  } catch (err) {
    clearRefreshCookie(res);
    return res.status(err.status || 401).json({ error: err.message || 'Falha refresh.' });
  }
});

// POST /api/logout — revoga refresh + clear cookie
router.post('/logout', async (req, res, next) => {
  const plain = req.cookies?.[REFRESH_COOKIE];
  try {
    if (plain) await revokeRefresh(plain);
  } catch (_) { /* ignore */ }
  clearRefreshCookie(res);
  await audit({ req, action: 'logout' });
  res.json({ ok: true });
});

module.exports = router;
