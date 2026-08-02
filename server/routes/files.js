const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { requireAuth, resolveProfile, isGuardianOf } = require('../middleware/auth');
const { UPLOAD_DIR, ensureUploadDir, filePath } = require('../services/fileService');

const router = express.Router();
ensureUploadDir();

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/pdf',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    cb(null, `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Formato no permitido. Usa imágenes, videos o PDF.'));
  },
});

function userIdFromToken(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.sub;
  } catch (err) {
    return null;
  }
}

function resolveAccess(req) {
  if (req.cookies && req.cookies.token) {
    const id = userIdFromToken(req.cookies.token);
    if (id) return id;
  }
  if (req.query.token) {
    const link = db.prepare('SELECT * FROM share_links WHERE token = ?').get(req.query.token);
    if (link) {
      if (link.expires_at && new Date(link.expires_at) < new Date()) return null;
      return link.user_id;
    }
  }
  return null;
}

router.post('/', requireAuth, resolveProfile, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });
  const { entity_type, entity_id, description } = req.body || {};
  if (!entity_type || !entity_id) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Faltan entity_type o entity_id.' });
  }
  const info = db
    .prepare(
      'INSERT INTO files (user_id, entity_type, entity_id, original_name, stored_name, mime_type, size, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      req.profileId,
      String(entity_type),
      Number(entity_id),
      req.file.originalname,
      req.file.filename,
      req.file.mimetype,
      req.file.size,
      description || null
    );
  const row = db.prepare('SELECT * FROM files WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ item: row });
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Archivo no encontrado.' });
  const accessUserId = resolveAccess(req);
  if (!accessUserId || (accessUserId !== row.user_id && !isGuardianOf(accessUserId, row.user_id))) {
    return res.status(403).json({ error: 'Sin acceso.' });
  }

  const p = filePath(row.stored_name);
  if (!fs.existsSync(p)) return res.status(404).json({ error: 'Archivo no encontrado.' });

  res.setHeader('Content-Type', row.mime_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(row.original_name)}"`);
  res.sendFile(p);
});

router.delete('/:id', requireAuth, resolveProfile, (req, res) => {
  const row = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(req.params.id, req.profileId);
  if (!row) return res.status(404).json({ error: 'Archivo no encontrado.' });
  db.prepare('DELETE FROM files WHERE id = ?').run(row.id);
  const p = filePath(row.stored_name);
  if (fs.existsSync(p)) {
    try { fs.unlinkSync(p); } catch (err) { /* ignore */ }
  }
  res.json({ ok: true });
});

module.exports = router;
