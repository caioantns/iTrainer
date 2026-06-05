const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/profissionais - lista publica enriquecida com perfil
router.get('/profissionais', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.profissional_id, p.nome, p.created_at,
              perfil.foto_url, perfil.cref, perfil.especialidades,
              perfil.experiencia, perfil.preco_hora, perfil.localizacao, perfil.online,
              COALESCE(ROUND(AVG(a.nota)::numeric, 1), 0) AS nota_media,
              COUNT(a.avaliacao_id) AS qtd_avaliacoes
       FROM profissionais p
       LEFT JOIN perfis_profissionais perfil ON perfil.profissional_id = p.profissional_id
       LEFT JOIN avaliacoes a ON a.profissional_id = p.profissional_id
       GROUP BY p.profissional_id, perfil.foto_url, perfil.cref, perfil.especialidades,
                perfil.experiencia, perfil.preco_hora, perfil.localizacao, perfil.online
       ORDER BY p.created_at DESC
       LIMIT 100`
    );
    res.json({
      profissionais: result.rows.map((r) => ({
        id: r.profissional_id,
        nome: r.nome,
        created_at: r.created_at,
        foto_url: r.foto_url,
        cref: r.cref,
        especialidades: r.especialidades || [],
        experiencia: r.experiencia,
        preco_hora: r.preco_hora,
        localizacao: r.localizacao,
        online: r.online,
        nota_media: Number(r.nota_media) || 0,
        qtd_avaliacoes: Number(r.qtd_avaliacoes) || 0,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/profissionais/:id - detalhe publico
router.get('/profissionais/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.profissional_id, p.nome, p.created_at,
              perfil.telefone, perfil.cref, perfil.foto_url, perfil.especialidades,
              perfil.experiencia, perfil.descricao, perfil.preco_hora,
              perfil.localizacao, perfil.online
       FROM profissionais p
       LEFT JOIN perfis_profissionais perfil ON perfil.profissional_id = p.profissional_id
       WHERE p.profissional_id = $1 LIMIT 1`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Profissional não encontrado.' });
    }
    const row = result.rows[0];
    res.json({
      profissional: {
        id: row.profissional_id,
        nome: row.nome,
        created_at: row.created_at,
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
  } catch (err) {
    next(err);
  }
});

module.exports = router;
