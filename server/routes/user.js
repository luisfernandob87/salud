const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { filePath } = require('../services/fileService');

const router = express.Router();

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash: _p, google_id: _g, ...rest } = user;
  return { ...rest, has_password: Boolean(user.password_hash) };
}

router.put('/profile', requireAuth, (req, res) => {
  const { name, birth_date, blood_type, height_cm } = req.body || {};
  const updates = {};
  if (name !== undefined) updates.name = String(name).trim();
  if (birth_date !== undefined) updates.birth_date = birth_date || null;
  if (blood_type !== undefined) updates.blood_type = blood_type || null;
  if (height_cm !== undefined) updates.height_cm = height_cm === '' || height_cm === null ? null : Number(height_cm);

  const keys = Object.keys(updates);
  if (keys.length === 0) return res.status(400).json({ error: 'Sin cambios.' });
  db.prepare(`UPDATE users SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(
    ...keys.map((k) => updates[k]),
    req.userId
  );
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json({ user: sanitizeUser(user) });
});

router.put('/password', requireAuth, (req, res) => {
  const { current_password, new_password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user.password_hash) {
    return res.status(400).json({ error: 'Esta cuenta usa Google. No tiene contraseña.' });
  }
  if (!current_password || !bcrypt.compareSync(String(current_password), user.password_hash)) {
    return res.status(400).json({ error: 'Contraseña actual incorrecta.' });
  }
  if (!new_password || String(new_password).length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
    bcrypt.hashSync(String(new_password), 10),
    req.userId
  );
  res.json({ ok: true });
});

router.delete('/', requireAuth, (req, res) => {
  const files = db.prepare('SELECT stored_name FROM files WHERE user_id = ?').all(req.userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.userId);
  for (const f of files) {
    const p = filePath(f.stored_name);
    if (fs.existsSync(p)) {
      try { fs.unlinkSync(p); } catch (err) { /* ignore */ }
    }
  }
  res.clearCookie('token');
  res.json({ ok: true });
});

module.exports = router;
