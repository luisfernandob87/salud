const jwt = require('jsonwebtoken');
const db = require('../db/database');

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) return res.status(401).json({ error: 'No autenticado.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado.' });
    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
}

function setAuthCookie(res, userId) {
  const token = signToken(userId);
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

// Resuelve el perfil activo a partir de ?profile=ID. Sin parámetro (o con el
// propio id) se usa la cuenta autenticada; cualquier otro perfil debe estar
// vinculado al usuario como tutor en family_links.
function resolveProfile(req, res, next) {
  const requested = req.query.profile;
  if (requested === undefined || requested === null || String(requested) === String(req.userId)) {
    req.profileId = req.userId;
    return next();
  }
  const profileId = Number(requested);
  if (!Number.isInteger(profileId)) {
    return res.status(400).json({ error: 'Perfil inválido.' });
  }
  const link = db
    .prepare('SELECT 1 FROM family_links WHERE profile_id = ? AND guardian_id = ?')
    .get(profileId, req.userId);
  if (!link) return res.status(403).json({ error: 'Sin acceso a este perfil.' });
  req.profileId = profileId;
  next();
}

function isGuardianOf(userId, profileId) {
  return Boolean(
    db.prepare('SELECT 1 FROM family_links WHERE profile_id = ? AND guardian_id = ?').get(profileId, userId)
  );
}

module.exports = { requireAuth, signToken, setAuthCookie, resolveProfile, isGuardianOf };
