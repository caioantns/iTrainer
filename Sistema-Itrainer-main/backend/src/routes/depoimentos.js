const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/depoimentos - lista depoimentos com autor
router.get('/depoimentos', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.depoimento_id, d.texto, d.data_criacao, c.nome AS autor
       FROM depoimentos d
       JOIN clientes c ON c.cliente_id = d.cliente_id
       ORDER BY d.data_criacao DESC
       LIMIT 20`
    );
    const items = result.rows.map((row) => ({
      id: row.depoimento_id,
      content: row.texto,
      author: row.autor,
      title: new Date(row.data_criacao).toLocaleDateString('pt-BR'),
      image: null,
      rating: 5,
    }));
    res.json({ depoimentos: items });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar depoimentos', details: err.message });
  }
});

module.exports = router;