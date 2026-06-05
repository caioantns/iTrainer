const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// POST /api/avaliacoes
router.post('/avaliacoes', authMiddleware, async (req, res, next) => {
  if (req.user.tipo !== 'cliente') {
    return res.status(403).json({ error: 'Apenas clientes podem avaliar.' });
  }
  const { profissional_id, nota, comentario } = req.body;
  const notaNum = Number(nota);
  if (!profissional_id || !Number.isInteger(notaNum)) {
    return res.status(400).json({ error: 'profissional_id e nota são obrigatórios.' });
  }
  if (notaNum < 1 || notaNum > 5) {
    return res.status(400).json({ error: 'nota deve estar entre 1 e 5.' });
  }
  if (comentario && (typeof comentario !== 'string' || comentario.length > 1000)) {
    return res.status(400).json({ error: 'comentario inválido (máx 1000 caracteres).' });
  }
  const cliente_id = req.user.id;
  try {
    const result = await pool.query(
      `INSERT INTO avaliacoes (cliente_id, profissional_id, nota, comentario)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (cliente_id, profissional_id)
       DO UPDATE SET nota = EXCLUDED.nota, comentario = EXCLUDED.comentario, updated_at = CURRENT_TIMESTAMP
       RETURNING avaliacao_id, cliente_id, profissional_id, nota, comentario`,
      [cliente_id, profissional_id, notaNum, comentario || null]
    );
    res.status(201).json({ avaliacao: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
