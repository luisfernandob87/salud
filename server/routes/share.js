const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { requireAuth, resolveProfile } = require('../middleware/auth');
const { attachFiles } = require('../services/fileService');

const router = express.Router();

const EXPIRIES = { '24h': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000, '30d': 30 * 24 * 60 * 60 * 1000 };

function parseJson(row) {
  for (const f of ['body_locations', 'tags']) {
    if (row[f] && typeof row[f] === 'string') {
      try { row[f] = JSON.parse(row[f]); } catch (err) { row[f] = []; }
    }
  }
  return row;
}

function collectPublicData(userId) {
  const user = db.prepare('SELECT id, name, birth_date, blood_type, height_cm FROM users WHERE id = ?').get(userId);

  const events = [];
  const symptoms = db.prepare("SELECT *, substr(occurred_at, 1, 10) AS date FROM symptoms WHERE user_id = ? ORDER BY occurred_at DESC").all(userId);
  for (const s of symptoms) { s.type = 'symptom'; events.push(parseJson(s)); }

  const consultations = db.prepare('SELECT * FROM consultations WHERE user_id = ? ORDER BY date DESC').all(userId);
  for (const c of consultations) { c.type = 'consultation'; events.push(parseJson(c)); }

  const medications = db.prepare("SELECT *, COALESCE(start_date, date('now')) AS date FROM medications WHERE user_id = ? ORDER BY date DESC").all(userId);
  for (const m of medications) { m.type = 'medication'; events.push(parseJson(m)); }

  const studies = db.prepare('SELECT * FROM studies WHERE user_id = ? ORDER BY date DESC').all(userId);
  for (const s of studies) { s.type = 'study'; events.push(parseJson(s)); }

  const daily = db.prepare('SELECT * FROM daily_health WHERE user_id = ? ORDER BY date DESC').all(userId);
  for (const d of daily) { d.type = 'daily'; events.push(d); }

  const notes = db.prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY date DESC').all(userId);
  for (const n of notes) { n.type = 'note'; events.push(parseJson(n)); }

  const withFiles = attachFiles(events);
  withFiles.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : b.id - a.id));

  return { user, items: withFiles };
}

function checkLink(link) {
  if (!link) return { ok: false, error: 'Enlace no válido.' };
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { ok: false, error: 'Este enlace ha expirado.' };
  }
  return { ok: true };
}

router.get('/', requireAuth, resolveProfile, (req, res) => {
  const rows = db.prepare('SELECT * FROM share_links WHERE user_id = ? ORDER BY created_at DESC').all(req.profileId);
  res.json({ items: rows });
});

router.post('/', requireAuth, resolveProfile, (req, res) => {
  const { expires, password } = req.body || {};
  const ttl = EXPIRIES[expires] || EXPIRIES['7d'];
  const token = crypto.randomBytes(18).toString('hex');
  const expiresAt = new Date(Date.now() + ttl).toISOString();
  const passwordHash = password ? bcrypt.hashSync(String(password), 10) : null;
  const info = db
    .prepare('INSERT INTO share_links (user_id, token, password_hash, expires_at) VALUES (?, ?, ?, ?)')
    .run(req.profileId, token, passwordHash, expiresAt);
  const row = db.prepare('SELECT * FROM share_links WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ item: row });
});

router.delete('/:id', requireAuth, resolveProfile, (req, res) => {
  const existing = db.prepare('SELECT id FROM share_links WHERE id = ? AND user_id = ?').get(req.params.id, req.profileId);
  if (!existing) return res.status(404).json({ error: 'Enlace no encontrado.' });
  db.prepare('DELETE FROM share_links WHERE id = ?').run(existing.id);
  res.json({ ok: true });
});

router.post('/verify', (req, res) => {
  const { token, password } = req.body || {};
  const link = db.prepare('SELECT * FROM share_links WHERE token = ?').get(token);
  const status = checkLink(link);
  if (!status.ok) return res.status(403).json({ error: status.error });
  if (link.password_hash) {
    if (!password || !bcrypt.compareSync(String(password), link.password_hash)) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }
  }
  res.json({ ok: true, expires_at: link.expires_at });
});

router.get('/public/:token', (req, res) => {
  const link = db.prepare('SELECT * FROM share_links WHERE token = ?').get(req.params.token);
  const status = checkLink(link);
  if (!status.ok) return res.status(403).json({ error: status.error });

  if (link.password_hash) {
    const password = req.query.password || '';
    if (!bcrypt.compareSync(String(password), link.password_hash)) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }
  }
  res.json({ data: collectPublicData(link.user_id) });
});

module.exports = router;
