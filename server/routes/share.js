const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { requireAuth, resolveProfile } = require('../middleware/auth');
const { attachFiles } = require('../services/fileService');

const router = express.Router();

const EXPIRIES = { '24h': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000, '30d': 30 * 24 * 60 * 60 * 1000 };

const RANGES = { '30d': 30, '3m': 3, '6m': 6 };

const ALLOWED_TYPES = ['symptom', 'consultation', 'medication', 'study', 'daily', 'note'];

function normalizeTypes(types) {
  if (!Array.isArray(types) || types.length === 0) return null;
  const unique = [...new Set(types)].filter((t) => ALLOWED_TYPES.includes(t));
  if (unique.length === 0) return null;
  if (unique.length === ALLOWED_TYPES.length) return null;
  return JSON.stringify(unique);
}

function parseTypes(types) {
  if (!types) return null;
  try {
    const arr = JSON.parse(types);
    if (Array.isArray(arr) && arr.length > 0) return arr;
  } catch (err) {
    /* ignore */
  }
  return null;
}

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function rangeDates(range) {
  if (range === 'all' || !RANGES[range]) return { date_from: null, date_to: null };
  const to = new Date();
  const from = new Date(to);
  if (range === '30d') {
    from.setDate(from.getDate() - 30);
  } else {
    from.setMonth(from.getMonth() - RANGES[range]);
  }
  return { date_from: isoDate(from), date_to: isoDate(to) };
}

function parseJson(row) {
  for (const f of ['body_locations', 'tags']) {
    if (row[f] && typeof row[f] === 'string') {
      try { row[f] = JSON.parse(row[f]); } catch (err) { row[f] = []; }
    }
  }
  return row;
}

function collectPublicData(userId, dateFrom, dateTo, types) {
  const user = db.prepare('SELECT id, name, birth_date, blood_type, height_cm FROM users WHERE id = ?').get(userId);

  const include = (t) => !types || types.includes(t);
  const events = [];
  let symptoms = db.prepare("SELECT *, substr(occurred_at, 1, 10) AS date FROM symptoms WHERE user_id = ? AND visible_in_pdf = 1 ORDER BY occurred_at DESC").all(userId);
  if (dateFrom && dateTo) symptoms = symptoms.filter((s) => s.date >= dateFrom && s.date <= dateTo);
  if (include('symptom')) for (const s of symptoms) { s.type = 'symptom'; events.push(parseJson(s)); }

  let consultations = db.prepare('SELECT * FROM consultations WHERE user_id = ? AND visible_in_pdf = 1 ORDER BY date DESC').all(userId);
  if (dateFrom && dateTo) consultations = consultations.filter((c) => c.date >= dateFrom && c.date <= dateTo);
  if (include('consultation')) for (const c of consultations) { c.type = 'consultation'; events.push(parseJson(c)); }

  let medications = db.prepare("SELECT *, COALESCE(start_date, date('now')) AS date FROM medications WHERE user_id = ? AND visible_in_pdf = 1 ORDER BY date DESC").all(userId);
  if (dateFrom && dateTo) {
    medications = medications.filter(
      (m) => m.start_date <= dateTo && (!m.end_date || m.end_date >= dateFrom)
    );
  }
  if (include('medication')) for (const m of medications) { m.type = 'medication'; events.push(parseJson(m)); }

  let studies = db.prepare('SELECT * FROM studies WHERE user_id = ? AND visible_in_pdf = 1 ORDER BY date DESC').all(userId);
  if (dateFrom && dateTo) studies = studies.filter((s) => s.date >= dateFrom && s.date <= dateTo);
  if (include('study')) for (const s of studies) { s.type = 'study'; events.push(parseJson(s)); }

  let daily = db.prepare('SELECT * FROM daily_health WHERE user_id = ? AND visible_in_pdf = 1 ORDER BY date DESC').all(userId);
  if (dateFrom && dateTo) daily = daily.filter((d) => d.date >= dateFrom && d.date <= dateTo);
  if (include('daily')) for (const d of daily) { d.type = 'daily'; events.push(d); }

  let notes = db.prepare('SELECT * FROM notes WHERE user_id = ? AND visible_in_pdf = 1 ORDER BY date DESC').all(userId);
  if (dateFrom && dateTo) notes = notes.filter((n) => n.date >= dateFrom && n.date <= dateTo);
  if (include('note')) for (const n of notes) { n.type = 'note'; events.push(parseJson(n)); }

  const withFiles = attachFiles(events);
  withFiles.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : b.id - a.id));

  return { user, items: withFiles, range: { date_from: dateFrom, date_to: dateTo }, types };
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
  const { expires, password, range, types } = req.body || {};
  const ttl = EXPIRIES[expires] || EXPIRIES['7d'];
  const { date_from, date_to } = rangeDates(range);
  const typesJson = normalizeTypes(types);
  const token = crypto.randomBytes(18).toString('hex');
  const expiresAt = new Date(Date.now() + ttl).toISOString();
  const passwordHash = password ? bcrypt.hashSync(String(password), 10) : null;
  const info = db
    .prepare('INSERT INTO share_links (user_id, token, password_hash, expires_at, date_from, date_to, types) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(req.profileId, token, passwordHash, expiresAt, date_from, date_to, typesJson);
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
  res.json({ data: collectPublicData(link.user_id, link.date_from, link.date_to, parseTypes(link.types)) });
});

module.exports = router;
