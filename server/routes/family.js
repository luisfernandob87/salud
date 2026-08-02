const crypto = require('crypto');
const fs = require('fs');
const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { filePath } = require('../services/fileService');
const { transferProfile, findDependentByClaimCode } = require('../services/profileTransfer');

const router = express.Router();

function generateCode() {
  return crypto.randomBytes(6).toString('hex');
}

function ageFrom(birthDate) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash: _p, google_id: _g, ...rest } = user;
  return { ...rest, has_password: Boolean(user.password_hash) };
}

// Excluye campos sensibles. Los códigos de un dependiente solo se muestran a
// los tutores (cualquiera con family_links sobre ese perfil).
function sanitizeProfile(row, relation, viewerId) {
  const { password_hash: _p, google_id: _g, family_code, claim_code, ...rest } = row;
  const result = {
    ...rest,
    relation: relation || null,
    me: row.id === viewerId,
    age: ageFrom(row.birth_date),
  };
  if (row.is_dependent && row.id !== viewerId) {
    result.family_code = family_code;
    result.claim_code = claim_code;
  }
  return result;
}

// Devuelve el perfil dependiente gestionado por el usuario autenticado.
function managedProfile(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Perfil inválido.' });
    return null;
  }
  const link = db
    .prepare('SELECT * FROM family_links WHERE profile_id = ? AND guardian_id = ?')
    .get(id, req.userId);
  if (!link) {
    res.status(404).json({ error: 'Perfil no encontrado.' });
    return null;
  }
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!row) {
    res.status(404).json({ error: 'Perfil no encontrado.' });
    return null;
  }
  return { row, relation: link.relation };
}

router.get('/', requireAuth, (req, res) => {
  const profiles = [];
  const me = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  profiles.push(sanitizeProfile(me, null, req.userId));

  const links = db
    .prepare('SELECT * FROM family_links WHERE guardian_id = ? ORDER BY created_at ASC')
    .all(req.userId);
  for (const link of links) {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(link.profile_id);
    if (!row) continue;
    profiles.push(sanitizeProfile(row, link.relation, req.userId));
  }
  res.json({ profiles });
});

router.post('/', requireAuth, (req, res) => {
  const { name, relation, birth_date, blood_type, height_cm } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio.' });
  }
  const info = db
    .prepare(
      `INSERT INTO users (name, email, is_dependent, family_code, claim_code, birth_date, blood_type, height_cm)
       VALUES (?, NULL, 1, ?, ?, ?, ?, ?)`
    )
    .run(
      String(name).trim(),
      generateCode(),
      generateCode(),
      birth_date || null,
      blood_type || null,
      height_cm === '' || height_cm === null ? null : Number(height_cm)
    );
  const profileId = info.lastInsertRowid;
  db.prepare('INSERT INTO family_links (profile_id, guardian_id, relation) VALUES (?, ?, ?)').run(
    profileId,
    req.userId,
    String(relation).trim() || 'otro'
  );
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(profileId);
  res.status(201).json({ profile: sanitizeProfile(row, String(relation).trim() || 'otro', req.userId) });
});

router.put('/:id', requireAuth, (req, res) => {
  const managed = managedProfile(req, res);
  if (!managed) return;
  const { name, relation, birth_date, blood_type, height_cm } = req.body || {};
  const updates = {};
  if (name !== undefined && String(name).trim()) updates.name = String(name).trim();
  if (birth_date !== undefined) updates.birth_date = birth_date || null;
  if (blood_type !== undefined) updates.blood_type = blood_type || null;
  if (height_cm !== undefined) updates.height_cm = height_cm === '' || height_cm === null ? null : Number(height_cm);
  const keys = Object.keys(updates);
  if (keys.length) {
    db.prepare(`UPDATE users SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(
      ...keys.map((k) => updates[k]),
      managed.row.id
    );
  }
  if (relation !== undefined) {
    db.prepare('UPDATE family_links SET relation = ? WHERE profile_id = ? AND guardian_id = ?').run(
      String(relation).trim() || 'otro',
      managed.row.id,
      req.userId
    );
  }
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(managed.row.id);
  res.json({ profile: sanitizeProfile(row, relation ?? managed.relation, req.userId) });
});

router.delete('/:id', requireAuth, (req, res) => {
  const managed = managedProfile(req, res);
  if (!managed) return;
  const files = db.prepare('SELECT stored_name FROM files WHERE user_id = ?').all(managed.row.id);
  // El borrado en cascada elimina historial, archivos, enlaces compartidos y family_links.
  db.prepare('DELETE FROM users WHERE id = ?').run(managed.row.id);
  for (const f of files) {
    const p = filePath(f.stored_name);
    if (fs.existsSync(p)) {
      try { fs.unlinkSync(p); } catch (err) { /* ignore */ }
    }
  }
  res.json({ ok: true });
});

// Códigos (ver y regenerar) para perfiles gestionados por el tutor.
function addCodeRoutes(type) {
  const column = type === 'claim' ? 'claim_code' : 'family_code';
  router.get(`/:id/${type}-code`, requireAuth, (req, res) => {
    const managed = managedProfile(req, res);
    if (!managed) return;
    res.json({ code: managed.row[column] });
  });
  router.post(`/:id/${type}-code`, requireAuth, (req, res) => {
    const managed = managedProfile(req, res);
    if (!managed) return;
    const code = generateCode();
    db.prepare(`UPDATE users SET ${column} = ? WHERE id = ?`).run(code, managed.row.id);
    res.json({ code });
  });
}
addCodeRoutes('claim');
addCodeRoutes('family');

// La madre (o cualquier usuario registrado) se une como co-tutor con el código
// de acceso del perfil.
router.post('/join', requireAuth, (req, res) => {
  const { code } = req.body || {};
  if (!code || !String(code).trim()) {
    return res.status(400).json({ error: 'Introduce el código de acceso.' });
  }
  const profile = db
    .prepare('SELECT * FROM users WHERE is_dependent = 1 AND lower(family_code) = lower(?)')
    .get(String(code).trim());
  if (!profile) return res.status(400).json({ error: 'Código no válido.' });
  if (profile.id === req.userId) {
    return res.status(400).json({ error: 'No puedes unirte a tu propio perfil.' });
  }
  const existing = db
    .prepare('SELECT 1 FROM family_links WHERE profile_id = ? AND guardian_id = ?')
    .get(profile.id, req.userId);
  if (existing) return res.status(409).json({ error: 'Ya eres cuidador de este perfil.' });
  db.prepare('INSERT INTO family_links (profile_id, guardian_id, relation) VALUES (?, ?, ?)').run(
    profile.id,
    req.userId,
    'cuidador'
  );
  res.json({ profile: sanitizeProfile(profile, 'cuidador', req.userId) });
});

// Transferencia de propiedad: el hijo (mayor o no) reclama su historial con el
// código de reclamación y lo asocia a su propia cuenta.
router.post('/claim', requireAuth, (req, res) => {
  const { code } = req.body || {};
  const dependent = findDependentByClaimCode(code);
  if (!dependent) return res.status(400).json({ error: 'Código no válido.' });
  transferProfile(dependent.id, req.userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json({ ok: true, user: sanitizeUser(user) });
});

module.exports = router;
