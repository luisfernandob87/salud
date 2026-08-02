const express = require('express');
const db = require('../db/database');
const { attachFiles } = require('../services/fileService');

const router = express.Router();

const SEARCH_TABLES = {
  symptom: {
    table: 'symptoms',
    fields: ['notes', 'kind', 'duration', 'causes', 'activity', 'relief', 'body_locations', 'tags'],
    dateExpr: 'substr(occurred_at, 1, 10)',
  },
  consultation: {
    table: 'consultations',
    fields: ['specialty', 'doctor', 'place', 'reason', 'diagnosis', 'treatment', 'recommendations', 'notes', 'tags'],
    dateExpr: 'date',
  },
  medication: {
    table: 'medications',
    fields: ['name', 'dosage', 'frequency', 'prescribed_by', 'notes', 'tags'],
    dateExpr: "COALESCE(start_date, date('now'))",
  },
  study: {
    table: 'studies',
    fields: ['category', 'description', 'observations', 'tags'],
    dateExpr: 'date',
  },
  daily: {
    table: 'daily_health',
    fields: ['notes', 'activity'],
    dateExpr: 'date',
  },
  note: {
    table: 'notes',
    fields: ['title', 'content', 'tags'],
    dateExpr: 'date',
  },
};

function parseJson(row) {
  for (const f of ['body_locations', 'tags']) {
    if (row[f] && typeof row[f] === 'string') {
      try { row[f] = JSON.parse(row[f]); } catch (err) { row[f] = []; }
    }
  }
  return row;
}

router.get('/', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) return res.json({ results: { symptom: [], consultation: [], medication: [], study: [], daily: [], note: [] } });

  const results = { symptom: [], consultation: [], medication: [], study: [], daily: [], note: [] };

  for (const [type, cfg] of Object.entries(SEARCH_TABLES)) {
    const conditions = cfg.fields.map((f) => `lower(${f}) LIKE ?`);
    const like = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
    const params = cfg.fields.map(() => like);
    const sql = `
      SELECT *, ${cfg.dateExpr} AS date
      FROM ${cfg.table}
      WHERE user_id = ? AND (${conditions.join(' OR ')})
      ORDER BY date DESC, id DESC
    `;
    const rows = db.prepare(sql).all(req.profileId, ...params);
    for (const r of rows) {
      r.type = type;
      results[type].push(parseJson(r));
    }
  }

  for (const type of Object.keys(results)) {
    results[type] = attachFiles(results[type]);
  }

  res.json({ results });
});

module.exports = router;
