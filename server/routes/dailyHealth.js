const express = require('express');
const db = require('../db/database');
const { attachFiles } = require('../services/fileService');

const router = express.Router();

const FIELDS = ['date', 'mood', 'sleep_hours', 'activity', 'weight_kg', 'bp_sys', 'bp_dia', 'glucose', 'temperature', 'heart_rate', 'spo2', 'notes', 'visible_in_pdf'];

function normalize(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return String(v).trim() === '' ? null : v;
}

function parseRow(row) {
  if (row) row.type = 'daily';
  return row;
}

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM daily_health WHERE user_id = ? ORDER BY date DESC')
    .all(req.profileId)
    .map(parseRow);
  res.json({ items: attachFiles(rows) });
});

router.get('/:date', (req, res) => {
  const row = db
    .prepare('SELECT * FROM daily_health WHERE user_id = ? AND date = ?')
    .get(req.profileId, req.params.date);
  if (!row) return res.status(404).json({ error: 'Sin registro para esta fecha.' });
  res.json({ item: attachFiles([parseRow(row)])[0] });
});

router.put('/', (req, res) => {
  const date = normalize(req.body.date);
  if (!date) return res.status(400).json({ error: 'La fecha es obligatoria.' });

  const record = { date };
  for (const f of FIELDS) {
    if (f === 'date') continue;
    if (req.body[f] === undefined) continue;
    record[f] = normalize(req.body[f]);
  }

  const existing = db.prepare('SELECT id FROM daily_health WHERE user_id = ? AND date = ?').get(req.profileId, date);
  if (existing) {
    const cols = Object.keys(record).filter((c) => c !== 'date');
    if (cols.length > 0) {
      db.prepare(
        `UPDATE daily_health SET ${cols.map((c) => `${c} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`
      ).run(...cols.map((c) => record[c]), existing.id);
    }
  } else {
    const cols = Object.keys(record);
    db.prepare(
      `INSERT INTO daily_health (user_id${cols.length ? ', ' + cols.join(', ') : ''}) VALUES (?${cols.length ? ', ' + cols.map(() => '?').join(', ') : ''})`
    ).run(req.profileId, ...cols.map((c) => record[c]));
  }

  const row = db.prepare('SELECT * FROM daily_health WHERE user_id = ? AND date = ?').get(req.profileId, date);
  res.json({ item: attachFiles([parseRow(row)])[0] });
});

router.delete('/:date', (req, res) => {
  const existing = db.prepare('SELECT id FROM daily_health WHERE user_id = ? AND date = ?').get(req.profileId, req.params.date);
  if (!existing) return res.status(404).json({ error: 'Sin registro para esta fecha.' });
  db.prepare('DELETE FROM daily_health WHERE id = ?').run(existing.id);
  res.json({ ok: true });
});

module.exports = router;
