const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function run() {
  try {
    const senhaHash = await bcrypt.hash('senha12345', 12);

    console.log('Seeding: cliente de teste...');
    const clienteRes = await pool.query(
      `INSERT INTO clientes (nome, email, senha)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome
       RETURNING cliente_id`,
      ['Cliente Teste', 'cliente.teste@example.com', senhaHash]
    );
    const clienteId = clienteRes.rows[0].cliente_id;

    console.log('Seeding: profissional de teste...');
    const profRes = await pool.query(
      `INSERT INTO profissionais (nome, email, senha)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome
       RETURNING profissional_id`,
      ['Profissional Teste', 'profissional.teste@example.com', senhaHash]
    );
    const profId = profRes.rows[0].profissional_id;

    console.log('Seeding: depoimento...');
    await pool.query(
      `INSERT INTO depoimentos (cliente_id, texto) VALUES ($1, $2)`,
      [clienteId, 'Ótimo atendimento e resultados visíveis!']
    );

    console.log('Seed concluído:', {
      cliente_id: clienteId,
      profissional_id: profId,
      login_cliente: 'cliente.teste@example.com / senha12345',
      login_profissional: 'profissional.teste@example.com / senha12345',
    });
  } catch (err) {
    console.error('Erro no seed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
    process.exit();
  }
}

run();
