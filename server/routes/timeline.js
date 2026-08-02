const express = require('express');
const db = require('../db/database');
const { attachFiles } = require('../services/fileService');

const router = express.Router();

const JSON_FIELDS = ['body_locations', 'tags'];

function parseJson(row) {
  for (const f of JSON_FIELDS) {
    if (row[f] && typeof row[f] === 'string') {
      try { row[f] = JSON.parse(row[f]); } catch (err) { row[f] = []; }
    }
  }
  return row;
}

router.get('/', (req, res) => {
  const events = [];

  const symptoms = db
    .prepare("SELECT *, substr(occurred_at, 1, 10) AS date FROM symptoms WHERE user_id = ? ORDER BY occurred_at DESC")
    .all(req.profileId);
  for (const s of symptoms) { s.type = 'symptom'; events.push(s); }

  const consultations = db
    .prepare('SELECT * FROM consultations WHERE user_id = ? ORDER BY date DESC')
    .all(req.profileId);
  for (const c of consultations) { c.type = 'consultation'; events.push(c); }

  const medications = db
    .prepare("SELECT *, COALESCE(start_date, date('now')) AS date FROM medications WHERE user_id = ? ORDER BY COALESCE(start_date, date('now')) DESC")
    .all(req.profileId);
  for (const m of medications) { m.type = 'medication'; events.push(m); }

  const studies = db
    .prepare('SELECT * FROM studies WHERE user_id = ? ORDER BY date DESC')
    .all(req.profileId);
  for (const s of studies) { s.type = 'study'; events.push(s); }

  const daily = db
    .prepare('SELECT * FROM daily_health WHERE user_id = ? ORDER BY date DESC')
    .all(req.profileId);
  for (const d of daily) { d.type = 'daily'; events.push(d); }

  const notes = db
    .prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY date DESC')
    .all(req.profileId);
  for (const n of notes) { n.type = 'note'; events.push(n); }

  const typed = events.map(parseJson);
  const withFiles = attachFiles(typed);

  withFiles.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : b.id - a.id));

  res.json({ items: withFiles });
});

module.exports = router;
