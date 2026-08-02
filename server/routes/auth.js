const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('../config/passport');
const db = require('../db/database');
const { requireAuth, setAuthCookie } = require('../middleware/auth');
const { transferProfile, findDependentByClaimCode } = require('../services/profileTransfer');

const router = express.Router();

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash: _p, google_id: _g, ...rest } = user;
  return { ...rest, has_password: Boolean(user.password_hash) };
}

router.post('/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }
  const normalized = String(email).toLowerCase().trim();
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(normalized);
  if (exists) return res.status(409).json({ error: 'Ya existe una cuenta con este correo.' });

  const claimCode = req.body.claim_code ? String(req.body.claim_code).trim() : null;
  const dependent = claimCode ? findDependentByClaimCode(claimCode) : null;
  if (claimCode && !dependent) {
    return res.status(400).json({ error: 'El código de reclamación no es válido.' });
  }

  const hash = bcrypt.hashSync(String(password), 10);
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(String(name).trim(), normalized, hash);
  const userId = info.lastInsertRowid;
  if (dependent) transferProfile(dependent.id, userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  setAuthCookie(res, user.id);
  res.status(201).json({ user: sanitizeUser(user) });
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info && info.message });
    setAuthCookie(res, user.id);
    return res.json({ user: sanitizeUser(user) });
  })(req, res, next);
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: process.env.CLIENT_ORIGIN + '/login?error=google' }),
  (req, res) => {
    setAuthCookie(res, req.user.id);
    res.redirect(process.env.CLIENT_ORIGIN + '/dashboard');
  }
);

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

module.exports = router;
