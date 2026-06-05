const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { audit } = require('../services/audit');

const STATUSES = ['PENDENTE', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO'];

// POST /api/agendamentos - cria agendamento (cliente agenda com profissional)
router.post('/agendamentos', authMiddleware, async (req, res, next) => {
  const { profissional_id, data_hora } = req.body;
  if (!profissional_id || !data_hora) {
    return res.status(400).json({ error: 'profissional_id e data_hora são obrigatórios.' });
  }
  if (req.user.tipo !== 'cliente') {
    return res.status(403).json({ error: 'Apenas clientes podem criar agendamentos.' });
  }
  const cliente_id = req.user.id;
  try {
    const result = await pool.query(
      `INSERT INTO agendamentos (data_hora, status, cliente_id, profissional_id)
       VALUES ($1, $2, $3, $4)
       RETURNING agendamento_id, data_hora, status, cliente_id, profissional_id`,
      [data_hora, 'PENDENTE', cliente_id, profissional_id]
    );
    await audit({
      req, action: 'agendamento.criado',
      target: `agendamento:${result.rows[0].agendamento_id}`,
      meta: { profissional_id, data_hora },
    });
    res.status(201).json({ agendamento: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/agendamentos?status= - lista agendamentos do usuario logado
router.get('/agendamentos', authMiddleware, async (req, res, next) => {
  const { status } = req.query;
  const where = [];
  const params = [];

  if (req.user.tipo === 'cliente') {
    params.push(req.user.id);
    where.push(`cliente_id = $${params.length}`);
  } else if (req.user.tipo === 'profissional') {
    params.push(req.user.id);
    where.push(`profissional_id = $${params.length}`);
  } else {
    return res.status(403).json({ error: 'Tipo de usuário inválido.' });
  }

  if (status) {
    const filtered = String(status)
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => STATUSES.includes(s));
    if (filtered.length > 0) {
      const placeholders = filtered.map((_, i) => `$${params.length + i + 1}`).join(',');
      params.push(...filtered);
      where.push(`status IN (${placeholders})`);
    }
  }

  try {
    const result = await pool.query(
      `SELECT agendamento_id, data_hora, status, cliente_id, profissional_id
       FROM agendamentos
       WHERE ${where.join(' AND ')}
       ORDER BY data_hora DESC
       LIMIT 100`,
      params
    );
    res.json({ agendamentos: result.rows });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/agendamentos/:id/status
router.patch('/agendamentos/:id/status', authMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const status = String(req.body.status || '').toUpperCase();
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }
  try {
    const existing = await pool.query(
      `SELECT cliente_id, profissional_id FROM agendamentos WHERE agendamento_id = $1 LIMIT 1`,
      [id]
    );
    if (existing.rowCount === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    }
    const row = existing.rows[0];
    const isCliente = req.user.tipo === 'cliente' && row.cliente_id === req.user.id;
    const isProf = req.user.tipo === 'profissional' && row.profissional_id === req.user.id;
    if (!isCliente && !isProf) {
      return res.status(403).json({ error: 'Sem permissão para atualizar este agendamento.' });
    }
    const result = await pool.query(
      `UPDATE agendamentos SET status = $1 WHERE agendamento_id = $2
       RETURNING agendamento_id, data_hora, status, cliente_id, profissional_id`,
      [status, id]
    );
    await audit({
      req, action: 'agendamento.status',
      target: `agendamento:${id}`,
      meta: { novo_status: status },
    });
    res.json({ agendamento: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
