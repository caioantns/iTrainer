const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { checkConnection } = require('./db');
const { isProd } = require('./config');

const app = express();
const PORT = Number(process.env.PORT || 3001);

// CORS_ORIGIN aceita CSV. Em prod CORS_ORIGIN obrigatorio.
const corsOriginRaw = process.env.CORS_ORIGIN || 'http://localhost:3000';
const corsOrigins = corsOriginRaw.split(',').map((s) => s.trim()).filter(Boolean);

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: isProd ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      // styleSrc precisa 'unsafe-inline' p/ React inline styles + Google Fonts/cdnjs.
      styleSrc: [
        "'self'", "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://cdnjs.cloudflare.com',
      ],
      fontSrc: [
        "'self'", 'data:',
        'https://fonts.gstatic.com',
        'https://cdnjs.cloudflare.com',
      ],
      imgSrc: [
        "'self'", 'data:', 'blob:',
        'https://images.unsplash.com',
        'https://api.dicebear.com',
      ],
      connectSrc: ["'self'"],
      frameSrc: ["'self'", 'https://www.google.com'], // mapa embed em /contato
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  } : false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Arquivos estaticos ANTES do CORS para nao bloquear assets
const buildPath = path.join(__dirname, '..', '..', 'build');
app.use(express.static(buildPath));

// Uploads estaticos (fotos). Cache 7d.
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath, {
  maxAge: 7 * 24 * 3600 * 1000,
  immutable: true,
  fallthrough: false,
}));

app.use(cors({
  origin: (origin, cb) => {
    // Same-origin (sem header Origin) ou whitelisted
    if (!origin || corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS bloqueado: origem nao permitida'));
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '3mb' }));

// Rate limit global
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Rate limit auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use(['/api/login', '/api/cadastro', '/api/refresh', '/api/forgot-password', '/api/reset-password'], authLimiter);

app.get('/api/status', async (req, res) => {
  const db = await checkConnection();
  res.json({ api: 'ok', db, timestamp: new Date().toISOString() });
});

app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/depoimentos'));
app.use('/api', require('./routes/agendamentos'));
app.use('/api', require('./routes/avaliacoes'));
app.use('/api', require('./routes/chat'));
app.use('/api', require('./routes/profissionais'));
app.use('/api', require('./routes/horarios'));
app.use('/api', require('./routes/pagamentos'));
app.use('/api', require('./routes/perfis'));
app.use('/api', require('./routes/uploads'));
app.use('/api', require('./routes/password_reset'));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(buildPath, 'index.html'));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  console.error('[API error]', req.method, req.originalUrl, err.message);
  const body = { error: err.publicMessage || 'Erro interno do servidor.' };
  if (!isProd) body.details = err.message;
  res.status(status).json(body);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`iTrainer API rodando em http://localhost:${PORT}`);
  });
}

module.exports = app;