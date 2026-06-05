process.env.JWT_SECRET = 'test-secret';

jest.mock('../src/db', () => ({
  checkConnection: async () => ({ ok: true }),
  pool: { query: jest.fn() },
}));

const request = require('supertest');
const app = require('../src/index');

describe('GET /api/status', () => {
  it('returns api ok and db status', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body.api).toBe('ok');
    expect(res.body.db).toEqual({ ok: true });
    expect(res.body.timestamp).toBeTruthy();
  });
});