const db = require('../db/database');

const DATA_TABLES = ['symptoms', 'consultations', 'medications', 'studies', 'daily_health', 'notes', 'files', 'share_links'];

function bad(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

// Busca un perfil dependiente por su código de reclamación (insensible a mayúsculas).
function findDependentByClaimCode(code) {
  if (!code || typeof code !== 'string') return null;
  return db
    .prepare('SELECT * FROM users WHERE is_dependent = 1 AND lower(claim_code) = lower(?)')
    .get(String(code).trim());
}

// Mueve todo el historial del perfil dependiente a la cuenta objetivo y elimina
// el perfil (sus family_links se borran por CASCADE). También copia datos
// demográficos al reclamante si este aún no los tiene.
function transferProfile(dependentId, targetUserId) {
  if (dependentId === targetUserId) throw bad('No puedes reclamar tu propio perfil.');
  const dependent = db.prepare('SELECT * FROM users WHERE id = ?').get(dependentId);
  if (!dependent || !dependent.is_dependent) throw bad('Código inválido o perfil no reclamable.');

  db.exec('BEGIN');
  try {
    for (const table of DATA_TABLES) {
      db.prepare(`UPDATE ${table} SET user_id = ? WHERE user_id = ?`).run(targetUserId, dependentId);
    }

    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId);
    const updates = {};
    if (dependent.birth_date && !target.birth_date) updates.birth_date = dependent.birth_date;
    if (dependent.blood_type && !target.blood_type) updates.blood_type = dependent.blood_type;
    if (dependent.height_cm && !target.height_cm) updates.height_cm = dependent.height_cm;
    const keys = Object.keys(updates);
    if (keys.length) {
      db.prepare(`UPDATE users SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(
        ...keys.map((k) => updates[k]),
        targetUserId
      );
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(dependentId);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = { transferProfile, findDependentByClaimCode };
