const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

async function assertAgendamentoMembership(agendamentoId, user) {
  const r = await pool.query(
    `SELECT cliente_id, profissional_id FROM agendamentos WHERE agendamento_id = $1 LIMIT 1`,
    [agendamentoId]
  );
  if (r.rowCount === 0) return { ok: false, status: 404, error: 'Agendamento não encontrado.' };
  const row = r.rows[0];
  const isCliente = user.tipo === 'cliente' && row.cliente_id === user.id;
  const isProf = user.tipo === 'profissional' && row.profissional_id === user.id;
  if (!isCliente && !isProf) return { ok: false, status: 403, error: 'Sem permissão para este chat.' };
  return { ok: true };
}

// GET /api/chat/:agendamentoId/mensagens
router.get('/chat/:agendamentoId/mensagens', authMiddleware, async (req, res, next) => {
  const { agendamentoId } = req.params;
  try {
    const check = await assertAgendamentoMembership(agendamentoId, req.user);
    if (!check.ok) return res.status(check.status).json({ error: check.error });

    const result = await pool.query(
      `SELECT mensagem_id, agendamento_id, remetente_id, tipo_remetente, conteudo, data_hora
       FROM chat_mensagens
       WHERE agendamento_id = $1
       ORDER BY data_hora ASC`,
      [agendamentoId]
    );
    res.json({ mensagens: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/chat/:agendamentoId/mensagens
router.post('/chat/:agendamentoId/mensagens', authMiddleware, async (req, res, next) => {
  const { agendamentoId } = req.params;
  const { conteudo } = req.body;
  if (!conteudo || typeof conteudo !== 'string' || conteudo.trim().length === 0) {
    return res.status(400).json({ error: 'conteudo é obrigatório.' });
  }
  if (conteudo.length > 2000) {
    return res.status(400).json({ error: 'conteudo excede 2000 caracteres.' });
  }
  try {
    const check = await assertAgendamentoMembership(agendamentoId, req.user);
    if (!check.ok) return res.status(check.status).json({ error: check.error });

    const remetente_id = req.user.id;
    const tipo_remetente = req.user.tipo === 'cliente' ? 'CLIENTE' : 'PROFISSIONAL';

    const result = await pool.query(
      `INSERT INTO chat_mensagens (agendamento_id, remetente_id, tipo_remetente, conteudo)
       VALUES ($1, $2, $3, $4)
       RETURNING mensagem_id, agendamento_id, remetente_id, tipo_remetente, conteudo, data_hora`,
      [agendamentoId, remetente_id, tipo_remetente, conteudo.trim()]
    );
    res.status(201).json({ mensagem: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
