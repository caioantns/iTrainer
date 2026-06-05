const express = require('express');
const router = express.Router();
const { pool, withTransaction } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// 0=Domingo ... 6=Sabado (padrao Postgres EXTRACT(DOW))
const DIA_INDEX = {
  'Domingo': 0,
  'Segunda': 1,
  'Terça': 2,
  'Quarta': 3,
  'Quinta': 4,
  'Sexta': 5,
  'Sábado': 6,
};

function resolveDia(slot) {
  if (slot.dia_semana != null) return Number(slot.dia_semana);
  if (slot.dia_texto && DIA_INDEX[slot.dia_texto] != null) return DIA_INDEX[slot.dia_texto];
  return NaN;
}

function validateSlot(s) {
  const ds = resolveDia(s);
  if (!Number.isInteger(ds) || ds < 0 || ds > 6) return 'dia_semana inválido (0-6)';
  if (!s.hora_inicio || !s.hora_fim) return 'hora_inicio e hora_fim obrigatórios';
  return null;
}

// GET /api/horarios?profissional_id=&dia_semana=
router.get('/horarios', async (req, res, next) => {
  const { profissional_id, dia_semana } = req.query;
  if (!profissional_id) {
    return res.status(400).json({ error: 'profissional_id é obrigatório.' });
  }
  const where = ['profissional_id = $1'];
  const params = [profissional_id];
  if (dia_semana !== undefined) {
    params.push(Number(dia_semana));
    where.push(`dia_semana = $${params.length}`);
  }
  try {
    const result = await pool.query(
      `SELECT horario_id, profissional_id, dia_semana,
              to_char(hora_inicio, 'HH24:MI') AS hora_inicio,
              to_char(hora_fim,    'HH24:MI') AS hora_fim,
              ativo
       FROM horarios_profissionais
       WHERE ${where.join(' AND ')}
       ORDER BY dia_semana ASC, hora_inicio ASC`,
      params
    );
    res.json({ horarios: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/horarios - upsert slot
router.post('/horarios', authMiddleware, async (req, res, next) => {
  if (req.user.tipo !== 'profissional') {
    return res.status(403).json({ error: 'Apenas profissionais podem gerenciar horários.' });
  }
  const slot = req.body || {};
  const err = validateSlot(slot);
  if (err) return res.status(400).json({ error: err });

  const profissional_id = req.user.id;
  const dia_semana = resolveDia(slot);
  const isActive = typeof slot.ativo === 'boolean' ? slot.ativo : true;

  try {
    const result = await pool.query(
      `INSERT INTO horarios_profissionais (profissional_id, dia_semana, hora_inicio, hora_fim, ativo)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (profissional_id, dia_semana, hora_inicio, hora_fim)
       DO UPDATE SET ativo = EXCLUDED.ativo, updated_at = NOW()
       RETURNING horario_id, profissional_id, dia_semana,
                 to_char(hora_inicio, 'HH24:MI') AS hora_inicio,
                 to_char(hora_fim,    'HH24:MI') AS hora_fim,
                 ativo`,
      [profissional_id, dia_semana, slot.hora_inicio, slot.hora_fim, isActive]
    );
    res.status(201).json({ horario: result.rows[0] });
  } catch (e) {
    next(e);
  }
});

// POST /api/horarios/bulk
router.post('/horarios/bulk', authMiddleware, async (req, res, next) => {
  if (req.user.tipo !== 'profissional') {
    return res.status(403).json({ error: 'Apenas profissionais podem gerenciar horários.' });
  }
  const { slots } = req.body || {};
  if (!Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ error: 'slots deve ser um array não-vazio.' });
  }
  if (slots.length > 200) {
    return res.status(400).json({ error: 'máximo 200 slots por requisição.' });
  }
  for (const s of slots) {
    const err = validateSlot(s);
    if (err) return res.status(400).json({ error: `slot inválido: ${err}` });
  }

  const profissional_id = req.user.id;
  try {
    const results = await withTransaction(async (client) => {
      const out = [];
      for (const s of slots) {
        const dia_semana = resolveDia(s);
        const isActive = typeof s.ativo === 'boolean' ? s.ativo : true;
        const r = await client.query(
          `INSERT INTO horarios_profissionais (profissional_id, dia_semana, hora_inicio, hora_fim, ativo)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (profissional_id, dia_semana, hora_inicio, hora_fim)
           DO UPDATE SET ativo = EXCLUDED.ativo, updated_at = NOW()
           RETURNING horario_id, profissional_id, dia_semana,
                     to_char(hora_inicio, 'HH24:MI') AS hora_inicio,
                     to_char(hora_fim,    'HH24:MI') AS hora_fim,
                     ativo`,
          [profissional_id, dia_semana, s.hora_inicio, s.hora_fim, isActive]
        );
        out.push(r.rows[0]);
      }
      return out;
    });
    res.status(201).json({ horarios: results });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/horarios/:id
router.delete('/horarios/:id', authMiddleware, async (req, res, next) => {
  if (req.user.tipo !== 'profissional') {
    return res.status(403).json({ error: 'Apenas profissionais podem gerenciar horários.' });
  }
  const profissional_id = req.user.id;
  const { id } = req.params;
  try {
    const r = await pool.query(
      `DELETE FROM horarios_profissionais WHERE horario_id = $1 AND profissional_id = $2`,
      [id, profissional_id]
    );
    if (r.rowCount === 0) {
      return res.status(404).json({ error: 'Horário não encontrado.' });
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
