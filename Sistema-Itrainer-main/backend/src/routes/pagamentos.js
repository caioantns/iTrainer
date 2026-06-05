const express = require('express');
const router = express.Router();
const { pool, withTransaction } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const asaas = require('../services/asaas');
const { audit } = require('../services/audit');

// GET /api/planos - lista planos ativos publicos
router.get('/planos', async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT p.plano_id, p.profissional_id, prof.nome AS profissional_nome,
              p.titulo, p.descricao, p.preco_centavos, p.duracao_dias
       FROM planos p
       JOIN profissionais prof ON prof.profissional_id = p.profissional_id
       WHERE p.ativo = TRUE
       ORDER BY p.created_at DESC
       LIMIT 100`
    );
    res.json({ planos: r.rows });
  } catch (e) { next(e); }
});

// GET /api/planos/meus - planos do profissional logado (inclui inativos)
router.get('/planos/meus', authMiddleware, async (req, res, next) => {
  if (req.user.tipo !== 'profissional') {
    return res.status(403).json({ error: 'Apenas profissionais.' });
  }
  try {
    const r = await pool.query(
      `SELECT plano_id, titulo, descricao, preco_centavos, duracao_dias, ativo, created_at
       FROM planos WHERE profissional_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ planos: r.rows });
  } catch (e) { next(e); }
});

// PATCH /api/planos/:id - editar/ativar/inativar plano (so dono)
router.patch('/planos/:id', authMiddleware, async (req, res, next) => {
  if (req.user.tipo !== 'profissional') {
    return res.status(403).json({ error: 'Apenas profissionais.' });
  }
  const { id } = req.params;
  const { titulo, descricao, preco_centavos, duracao_dias, ativo } = req.body || {};
  const sets = [];
  const params = [];
  function add(col, val) {
    params.push(val);
    sets.push(`${col} = $${params.length}`);
  }
  if (titulo !== undefined) {
    if (typeof titulo !== 'string' || titulo.length < 1 || titulo.length > 120) {
      return res.status(400).json({ error: 'titulo invalido.' });
    }
    add('titulo', titulo);
  }
  if (descricao !== undefined) add('descricao', descricao || null);
  if (preco_centavos !== undefined) {
    if (!Number.isInteger(preco_centavos) || preco_centavos < 0) {
      return res.status(400).json({ error: 'preco_centavos invalido.' });
    }
    add('preco_centavos', preco_centavos);
  }
  if (duracao_dias !== undefined) {
    if (!Number.isInteger(duracao_dias) || duracao_dias <= 0) {
      return res.status(400).json({ error: 'duracao_dias invalido.' });
    }
    add('duracao_dias', duracao_dias);
  }
  if (ativo !== undefined) {
    if (typeof ativo !== 'boolean') return res.status(400).json({ error: 'ativo deve ser boolean.' });
    add('ativo', ativo);
  }
  if (sets.length === 0) return res.status(400).json({ error: 'nenhum campo para atualizar.' });
  params.push(id, req.user.id);
  try {
    const r = await pool.query(
      `UPDATE planos SET ${sets.join(', ')}
       WHERE plano_id = $${params.length - 1} AND profissional_id = $${params.length}
       RETURNING plano_id, titulo, descricao, preco_centavos, duracao_dias, ativo`,
      params
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Plano nao encontrado.' });
    res.json({ plano: r.rows[0] });
  } catch (e) { next(e); }
});

// POST /api/planos - profissional cria plano
router.post('/planos', authMiddleware, async (req, res, next) => {
  if (req.user.tipo !== 'profissional') {
    return res.status(403).json({ error: 'Apenas profissionais podem criar planos.' });
  }
  const { titulo, descricao, preco_centavos, duracao_dias } = req.body || {};
  if (!titulo || !Number.isInteger(preco_centavos) || !Number.isInteger(duracao_dias)) {
    return res.status(400).json({ error: 'titulo, preco_centavos (int) e duracao_dias (int) obrigatorios.' });
  }
  if (preco_centavos < 0 || duracao_dias <= 0) {
    return res.status(400).json({ error: 'valores invalidos.' });
  }
  try {
    const r = await pool.query(
      `INSERT INTO planos (profissional_id, titulo, descricao, preco_centavos, duracao_dias)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING plano_id, titulo, descricao, preco_centavos, duracao_dias, ativo`,
      [req.user.id, titulo, descricao || null, preco_centavos, duracao_dias]
    );
    res.status(201).json({ plano: r.rows[0] });
  } catch (e) { next(e); }
});

// POST /api/pagamentos - cliente inicia pagamento Pix de um plano
router.post('/pagamentos', authMiddleware, async (req, res, next) => {
  if (req.user.tipo !== 'cliente') {
    return res.status(403).json({ error: 'Apenas clientes podem pagar.' });
  }
  if (!asaas.isConfigured()) {
    return res.status(503).json({ error: 'Gateway de pagamento nao configurado.' });
  }
  const { plano_id, cpfCnpj } = req.body || {};
  if (!plano_id) return res.status(400).json({ error: 'plano_id obrigatorio.' });

  try {
    const planoRes = await pool.query(
      `SELECT plano_id, profissional_id, titulo, preco_centavos, duracao_dias
       FROM planos WHERE plano_id = $1 AND ativo = TRUE LIMIT 1`,
      [plano_id]
    );
    if (planoRes.rowCount === 0) return res.status(404).json({ error: 'Plano nao encontrado.' });
    const plano = planoRes.rows[0];

    const cliRes = await pool.query(
      `SELECT cliente_id, nome, email FROM clientes WHERE cliente_id = $1 LIMIT 1`,
      [req.user.id]
    );
    const cliente = cliRes.rows[0];

    const customer = await asaas.ensureCustomer({ nome: cliente.nome, email: cliente.email, cpfCnpj });

    const today = new Date();
    today.setDate(today.getDate() + 1);
    const dueDate = today.toISOString().slice(0, 10);

    const charge = await asaas.createPixCharge({
      customerId: customer.id,
      value: Number((plano.preco_centavos / 100).toFixed(2)),
      description: `iTrainer - ${plano.titulo}`,
      externalReference: `plano:${plano.plano_id}:cliente:${cliente.cliente_id}`,
      dueDate,
    });

    const pixData = await asaas.getPixQrCode(charge.id);

    const ins = await pool.query(
      `INSERT INTO pagamentos
         (cliente_id, plano_id, gateway, gateway_charge_id, status, valor_centavos, metodo, invoice_url, pix_qr_payload)
       VALUES ($1, $2, 'asaas', $3, 'PENDING', $4, 'PIX', $5, $6)
       RETURNING pagamento_id, status, valor_centavos, invoice_url, pix_qr_payload`,
      [
        cliente.cliente_id,
        plano.plano_id,
        charge.id,
        plano.preco_centavos,
        charge.invoiceUrl || null,
        pixData.payload || null,
      ]
    );

    await audit({
      req, action: 'pagamento.criado',
      target: `pagamento:${ins.rows[0].pagamento_id}`,
      meta: { plano_id: plano.plano_id, valor_centavos: plano.preco_centavos },
    });
    res.status(201).json({
      pagamento: ins.rows[0],
      pix: { payload: pixData.payload, encodedImage: pixData.encodedImage, expirationDate: pixData.expirationDate },
    });
  } catch (e) { next(e); }
});

// GET /api/pagamentos/me - lista pagamentos do cliente logado
router.get('/pagamentos/me', authMiddleware, async (req, res, next) => {
  if (req.user.tipo !== 'cliente') {
    return res.status(403).json({ error: 'Apenas clientes.' });
  }
  try {
    const r = await pool.query(
      `SELECT pagamento_id, plano_id, status, valor_centavos, metodo, paid_at, created_at
       FROM pagamentos WHERE cliente_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ pagamentos: r.rows });
  } catch (e) { next(e); }
});

// Webhook Asaas — chamado pelo gateway, autenticado por token compartilhado
// Configurar no painel Asaas: URL = https://<host>/api/webhooks/asaas
// Header: asaas-access-token = <ASAAS_WEBHOOK_TOKEN>
router.post('/webhooks/asaas', express.json(), async (req, res, next) => {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  const got = req.header('asaas-access-token');
  if (!expected || got !== expected) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const event = req.body?.event;
  const payment = req.body?.payment;
  if (!event || !payment?.id) return res.status(400).json({ error: 'payload invalido' });

  try {
    await withTransaction(async (client) => {
      const cur = await client.query(
        `SELECT pagamento_id, cliente_id, plano_id, status FROM pagamentos
         WHERE gateway_charge_id = $1 LIMIT 1 FOR UPDATE`,
        [payment.id]
      );
      if (cur.rowCount === 0) return;
      const p = cur.rows[0];

      let novoStatus = p.status;
      if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') novoStatus = 'PAID';
      else if (event === 'PAYMENT_REFUNDED') novoStatus = 'REFUNDED';
      else if (event === 'PAYMENT_DELETED' || event === 'PAYMENT_CANCELED') novoStatus = 'CANCELED';

      if (novoStatus === p.status) return;

      await client.query(
        `UPDATE pagamentos SET status = $1, paid_at = CASE WHEN $1 = 'PAID' THEN NOW() ELSE paid_at END, updated_at = NOW()
         WHERE pagamento_id = $2`,
        [novoStatus, p.pagamento_id]
      );

      if (novoStatus === 'PAID') {
        const planoRes = await client.query(
          `SELECT duracao_dias FROM planos WHERE plano_id = $1 LIMIT 1`,
          [p.plano_id]
        );
        const dias = planoRes.rows[0]?.duracao_dias || 30;
        await client.query(
          `INSERT INTO assinaturas (cliente_id, plano_id, pagamento_id, expira_em)
           VALUES ($1, $2, $3, NOW() + ($4 || ' days')::interval)`,
          [p.cliente_id, p.plano_id, p.pagamento_id, String(dias)]
        );
      }
    });
    await audit({
      req, action: 'webhook.asaas',
      target: `gateway_charge:${payment.id}`,
      meta: { event },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
