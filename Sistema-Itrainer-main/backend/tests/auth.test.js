process.env.JWT_SECRET = 'test-secret';

const bcrypt = require('bcrypt');

jest.mock('../src/db', () => ({
  pool: { query: jest.fn() },
  checkConnection: async () => ({ ok: true }),
}));

const db = require('../src/db');
const request = require('supertest');
const app = require('../src/index');

describe('POST /api/login/clientes', () => {
  const mockRows = [];

  beforeEach(() => {
    mockRows.length = 0;
    db.pool.query.mockImplementation(async (sql, params) => {
      if (/FROM clientes/i.test(sql)) {
        return { rowCount: mockRows.length, rows: mockRows };
      }
      if (/UPDATE clientes/i.test(sql)) {
        return { rowCount: 1, rows: [] };
      }
      return { rowCount: 0, rows: [] };
    });
  });

  it('authenticates with bcrypt-hashed password and returns token', async () => {
    const hash = await bcrypt.hash('secret', 10);
    mockRows.push({ cliente_id: 1, nome: 'Cliente Teste', email: 'cli@teste.com', senha: hash });

    const res = await request(app)
      .post('/api/login/clientes')
      .send({ email: 'cli@teste.com', senha: 'secret' });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeTruthy();
    expect(res.body.user.id).toBe(1);
    expect(res.body.token).toBeTruthy();
  });

  it('migrates plaintext password to bcrypt on login', async () => {
    mockRows.push({ cliente_id: 2, nome: 'Cliente Plain', email: 'plain@teste.com', senha: 'abc123' });

    const res = await request(app)
      .post('/api/login/clientes')
      .send({ email: 'plain@teste.com', senha: 'abc123' });

    expect(res.status).toBe(200);
    expect(db.pool.query).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE clientes/i),
      expect.arrayContaining([expect.stringMatching(/^\$2/), 2])
    );
    expect(res.body.token).toBeTruthy();
  });

  it('rejects invalid credentials', async () => {
    mockRows.push({ cliente_id: 3, nome: 'Outro', email: 'x@y.com', senha: await bcrypt.hash('right', 10) });
    const res = await request(app).post('/api/login/clientes').send({ email: 'x@y.com', senha: 'wrong' });
    expect(res.status).toBe(401);
  });
});