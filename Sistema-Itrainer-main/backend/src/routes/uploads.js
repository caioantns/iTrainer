const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/auth');
const { audit } = require('../services/audit');

const router = express.Router();

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const FOTOS_DIR = path.join(UPLOAD_ROOT, 'fotos');
fs.mkdirSync(FOTOS_DIR, { recursive: true });

// Magic bytes p/ validar MIME real (anti-extension spoof / SVG XSS)
const MAGIC = [
  { mime: 'image/png',  ext: 'png',  sig: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', ext: 'jpg',  sig: [0xff, 0xd8, 0xff] },
  { mime: 'image/webp', ext: 'webp', sig: [0x52, 0x49, 0x46, 0x46], offset: 0, secondary: { offset: 8, sig: [0x57, 0x45, 0x42, 0x50] } },
  { mime: 'image/gif',  ext: 'gif',  sig: [0x47, 0x49, 0x46, 0x38] },
];

function sniffMime(buf) {
  for (const m of MAGIC) {
    const off = m.offset || 0;
    if (buf.length < off + m.sig.length) continue;
    let match = true;
    for (let i = 0; i < m.sig.length; i++) {
      if (buf[off + i] !== m.sig[i]) { match = false; break; }
    }
    if (!match) continue;
    if (m.secondary) {
      const so = m.secondary.offset;
      if (buf.length < so + m.secondary.sig.length) continue;
      let smatch = true;
      for (let i = 0; i < m.secondary.sig.length; i++) {
        if (buf[so + i] !== m.secondary.sig[i]) { smatch = false; break; }
      }
      if (!smatch) continue;
    }
    return { mime: m.mime, ext: m.ext };
  }
  return null;
}

// Multer: memoria (validar magic antes de gravar). Limite 2 MB.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Tipo de imagem nao suportado. Use PNG, JPEG, WEBP ou GIF.'));
    }
    cb(null, true);
  },
});

// POST /api/uploads/foto - upload de foto, retorna URL servida em /uploads/fotos/<file>
router.post('/uploads/foto', authMiddleware, upload.single('foto'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo "foto" obrigatorio.' });

    const sniff = sniffMime(req.file.buffer);
    if (!sniff) {
      return res.status(400).json({ error: 'Conteudo nao corresponde a uma imagem valida.' });
    }
    // Conferir consistencia entre header declarado e magic bytes
    if (req.file.mimetype.replace('image/jpg', 'image/jpeg') !== sniff.mime) {
      return res.status(400).json({ error: 'Mismatch entre tipo declarado e conteudo real.' });
    }

    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${req.user.tipo}-${req.user.id}-${hash}.${sniff.ext}`;
    const fullPath = path.join(FOTOS_DIR, filename);
    fs.writeFileSync(fullPath, req.file.buffer);

    const url = `/uploads/fotos/${filename}`;
    await audit({
      req, action: 'upload.foto',
      target: filename,
      meta: { size: req.file.size, mime: sniff.mime },
    });
    res.status(201).json({ url, mime: sniff.mime, size: req.file.size });
  } catch (e) { next(e); }
});

// Error handler especifico p/ multer (size limit etc)
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Arquivo maior que 2MB.' });
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
module.exports.UPLOAD_ROOT = UPLOAD_ROOT;
