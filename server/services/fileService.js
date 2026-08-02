const fs = require('fs');
const path = require('path');
const db = require('../db/database');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function filePath(storedName) {
  return path.join(UPLOAD_DIR, storedName);
}

function attachFiles(items) {
  const idsByType = {};
  for (const item of items) {
    if (!idsByType[item.type]) idsByType[item.type] = new Set();
    idsByType[item.type].add(item.id);
  }
  const fileMap = new Map();
  for (const [type, ids] of Object.entries(idsByType)) {
    if (ids.size === 0) continue;
    const placeholders = [...ids].map(() => '?').join(',');
    const rows = db
      .prepare(`SELECT * FROM files WHERE entity_type = ? AND entity_id IN (${placeholders}) ORDER BY created_at`)
      .all(type, ...ids);
    for (const row of rows) {
      const key = `${type}:${row.entity_id}`;
      if (!fileMap.has(key)) fileMap.set(key, []);
      fileMap.get(key).push(row);
    }
  }
  for (const item of items) {
    item.files = fileMap.get(`${item.type}:${item.id}`) || [];
  }
  return items;
}

function deleteFilesForEntity(userId, entityType, entityId) {
  const rows = db
    .prepare('SELECT * FROM files WHERE user_id = ? AND entity_type = ? AND entity_id = ?')
    .all(userId, entityType, entityId);
  db.prepare('DELETE FROM files WHERE user_id = ? AND entity_type = ? AND entity_id = ?').run(
    userId, entityType, entityId
  );
  for (const row of rows) {
    const p = filePath(row.stored_name);
    if (fs.existsSync(p)) {
      try { fs.unlinkSync(p); } catch (err) { /* ignore */ }
    }
  }
}

module.exports = { UPLOAD_DIR, ensureUploadDir, filePath, attachFiles, deleteFilesForEntity };
