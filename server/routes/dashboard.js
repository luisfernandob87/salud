const express = require('express');
const db = require('../db/database');
const { attachFiles } = require('../services/fileService');

const router = express.Router();

function parseJson(row) {
  for (const f of ['body_locations', 'tags']) {
    if (row[f] && typeof row[f] === 'string') {
      try { row[f] = JSON.parse(row[f]); } catch (err) { row[f] = []; }
    }
  }
  return row;
}

router.get('/', (req, res) => {
  const uid = req.profileId;

  const latestSymptoms = db
    .prepare('SELECT * FROM symptoms WHERE user_id = ? ORDER BY occurred_at DESC LIMIT 5')
    .all(uid)
    .map(parseJson);
  for (const s of latestSymptoms) s.type = 'symptom';

  const nextAppointments = db
    .prepare("SELECT * FROM consultations WHERE user_id = ? AND date >= date('now') ORDER BY date ASC LIMIT 3")
    .all(uid)
    .map(parseJson);
  for (const c of nextAppointments) c.type = 'consultation';

  const activeMedications = db
    .prepare("SELECT * FROM medications WHERE user_id = ? AND status = 'active' ORDER BY start_date DESC LIMIT 6")
    .all(uid)
    .map(parseJson);
  for (const m of activeMedications) m.type = 'medication';

  const latestDaily = db
    .prepare('SELECT * FROM daily_health WHERE user_id = ? ORDER BY date DESC LIMIT 7')
    .all(uid)
    .map(parseJson);
  for (const d of latestDaily) d.type = 'daily';

  const latestFiles = db
    .prepare('SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC LIMIT 8')
    .all(uid);

  const summary = {
    latestSymptoms: attachFiles(latestSymptoms),
    nextAppointments: attachFiles(nextAppointments),
    activeMedications: attachFiles(activeMedications),
    latestDaily,
    latestFiles,
  };

  res.json({ summary });
});

module.exports = router;
