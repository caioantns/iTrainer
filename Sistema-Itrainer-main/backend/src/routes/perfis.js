const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const MAX_FOTO_LEN = 2_000_000; // ~2MB data URL
// Whitelist MIME: bloqueia SVG (anti XSS via SVG script).
const FOTO_DATA_URL_RE = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const HTTPS_URL_RE = /^https:\/\/[^\s<>"']{1,500}$/;
const UPLOADS_REL_RE = /^\/uploads\/fotos\/[A-Za-z0-9_.-]{1,200}$/;

function validateFoto(v) {
  if (!v) return null;
  if (typeof v !== 'string') return 'foto_url tipo invalido';
  if (v.length > MAX_FOTO_LEN) return 'Foto muito grande (max 2MB).';
  if (v.startsWith('data:')) {
    if (!FOTO_DATA_URL_RE.test(v)) return 'Formato de imagem invalido (use png/jpeg/webp/gif).';
  } else if (v.startsWith('/uploads/')) {
    if (!UPLOADS_REL_RE.test(v)) return 'Caminho de upload invalido.';
  } else if (!HTTPS_URL_RE.test(v)) {
    return 'foto_url deve ser /uploads/, data URL ou HTTPS.';
  }
  return null;
}

function sanitizeArrayStrings(v, max = 30) {
  if (!Array.isArray(v)) return null;
  return v
    .filter((x) => typeof x === 'string' && x.length > 0 && x.length <= 60)
    .slice(0, max);
}

// GET /api/profissionais/:id/perfil - publico (sem PII sensivel)
router.get('/profissionais/:id/perfil', async (req, res, next) => {
  const { id } = req.params;
  try {
    const r = await pool.query(
      `SELECT p.profissional_id, p.nome, p.created_at,
              perfil.telefone, perfil.cref, perfil.foto_url, perfil.especialidades,
              perfil.experiencia, perfil.descricao, perfil.preco_hora,
              perfil.localizacao, perfil.online
       FROM profissionais p
       LEFT JOIN perfis_profissionais perfil ON perfil.profissional_id = p.profissional_id
       WHERE p.profissional_id = $1 LIMIT 1`,
      [id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Profissional nao encontrado.' });
    const row = r.rows[0];
    res.json({
      profissional: {
        id: row.profissional_id,
        nome: row.nome,
        created_at: row.created_at,
        telefone: row.telefone,
        cref: row.cref,
        foto_url: row.foto_url,
        especialidades: row.especialidades || [],
        experiencia: row.experiencia,
        descricao: row.descricao,
        preco_hora: row.preco_hora,
        localizacao: row.localizacao,
        online: row.online,
      },
    });
  } catch (e) { next(e); }
});

// PUT /api/profissionais/me/perfil - profissional logado edita proprio perfil
router.put('/profissionais/me/perfil', authMiddleware, async (req, res, next) => {
  if (req.user.tipo !== 'profissional') {
    return res.status(403).json({ error: 'Apenas profissionais.' });
  }
  const b = req.body || {};
  const fotoErr = validateFoto(b.foto_url);
  if (fotoErr) return res.status(400).json({ error: fotoErr });

  const especialidades = sanitizeArrayStrings(b.especialidades);
  const preco_hora = b.preco_hora != null && Number.isFinite(Number(b.preco_hora))
    ? Math.max(0, Math.round(Number(b.preco_hora)))
    : null;
  const experiencia = b.experiencia != null && Number.isFinite(Number(b.experiencia))
    ? Math.max(0, Math.round(Number(b.experiencia)))
    : null;

  try {
    const r = await pool.query(
      `INSERT INTO perfis_profissionais
         (profissional_id, telefone, cref, foto_url, especialidades, experiencia,
          descricao, preco_hora, localizacao, online, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (profissional_id) DO UPDATE SET
         telefone = EXCLUDED.telefone,
         cref = EXCLUDED.cref,
         foto_url = EXCLUDED.foto_url,
         especialidades = EXCLUDED.especialidades,
         experiencia = EXCLUDED.experiencia,
         descricao = EXCLUDED.descricao,
         preco_hora = EXCLUDED.preco_hora,
         localizacao = EXCLUDED.localizacao,
         online = EXCLUDED.online,
         updated_at = NOW()
       RETURNING *`,
      [
        req.user.id,
        b.telefone || null,
        b.cref || null,
        b.foto_url || null,
        especialidades,
        experiencia,
        b.descricao || null,
        preco_hora,
        b.localizacao || null,
        typeof b.online === 'boolean' ? b.online : true,
      ]
    );
    res.json({ perfil: r.rows[0] });
  } catch (e) { next(e); }
});

// GET /api/clientes/me/perfil
router.get('/clientes/me/perfil', authMiddleware, async (req, res, next) => {
  if (req.user.tipo !== 'cliente') return res.status(403).json({ error: 'Apenas clientes.' });
  try {
    const r = await pool.query(
      `SELECT c.cliente_id, c.nome, c.email, c.created_at,
              p.telefone, p.data_nascimento, p.objetivos, p.nivel,
              p.restricoes, p.preferencias, p.localizacao, p.foto_url
       FROM clientes c
       LEFT JOIN perfis_clientes p ON p.cliente_id = c.cliente_id
       WHERE c.cliente_id = $1 LIMIT 1`,
      [req.user.id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Cliente nao encontrado.' });
    res.json({ cliente: r.rows[0] });
  } catch (e) { next(e); }
});

// PUT /api/clientes/me/perfil
router.put('/clientes/me/perfil', authMiddleware, async (req, res, next) => {
  if (req.user.tipo !== 'cliente') return res.status(403).json({ error: 'Apenas clientes.' });
  const b = req.body || {};
  const fotoErr = validateFoto(b.foto_url);
  if (fotoErr) return res.status(400).json({ error: fotoErr });
  const objetivos = sanitizeArrayStrings(b.objetivos);
  const preferencias = sanitizeArrayStrings(b.preferencias);
  try {
    const r = await pool.query(
      `INSERT INTO perfis_clientes
         (cliente_id, telefone, data_nascimento, objetivos, nivel, restricoes,
          preferencias, localizacao, foto_url, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (cliente_id) DO UPDATE SET
         telefone = EXCLUDED.telefone,
         data_nascimento = EXCLUDED.data_nascimento,
         objetivos = EXCLUDED.objetivos,
         nivel = EXCLUDED.nivel,
         restricoes = EXCLUDED.restricoes,
         preferencias = EXCLUDED.preferencias,
         localizacao = EXCLUDED.localizacao,
         foto_url = EXCLUDED.foto_url,
         updated_at = NOW()
       RETURNING *`,
      [
        req.user.id,
        b.telefone || null,
        b.data_nascimento || null,
        objetivos,
        b.nivel || null,
        b.restricoes || null,
        preferencias,
        b.localizacao || null,
        b.foto_url || null,
      ]
    );
    res.json({ perfil: r.rows[0] });
  } catch (e) { next(e); }
});

module.exports = router;
