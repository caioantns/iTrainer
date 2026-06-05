const isProd = process.env.NODE_ENV === 'production';

function requireJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || s === 'dev-secret' || s === 'change-me-in-production') {
    if (isProd) {
      throw new Error('JWT_SECRET ausente ou inseguro em produção. Configure env JWT_SECRET com valor forte.');
    }
    console.warn('[WARN] JWT_SECRET fraco/ausente — usando padrão de dev. NÃO usar em produção.');
    return 'dev-secret-do-not-use-in-prod';
  }
  if (s.length < 32) {
    if (isProd) {
      throw new Error('JWT_SECRET deve ter >= 32 caracteres em produção.');
    }
    console.warn('[WARN] JWT_SECRET curto (<32 chars).');
  }
  return s;
}

module.exports = {
  isProd,
  JWT_SECRET: requireJwtSecret(),
  JWT_ISSUER: process.env.JWT_ISSUER || 'itrainer-api',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'itrainer-app',
  // Access curto: 15min. Refresh longo: 30d.
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_TTL_DAYS: (() => {
    const raw = (process.env.REFRESH_TOKEN_TTL_DAYS || '').trim().replace(/^=/, '');
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0 || n > 365) {
      if (raw) console.warn(`[WARN] REFRESH_TOKEN_TTL_DAYS invalido (${raw}) — usando 30.`);
      return 30;
    }
    return n;
  })(),
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
};
