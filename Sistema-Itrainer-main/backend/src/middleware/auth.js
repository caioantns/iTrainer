const { verifyAccess } = require('../services/tokens');

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token ausente.' });
  }
  try {
    const payload = verifyAccess(token);
    req.user = { id: Number(payload.sub), tipo: payload.tipo };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido.' });
  }
}

module.exports = { authMiddleware };
