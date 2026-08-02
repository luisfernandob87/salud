const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../db/database');

passport.use(
  new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(String(email).toLowerCase().trim());
    if (!user) return done(null, false, { message: 'Correo o contraseña incorrectos.' });
    if (!user.password_hash) {
      return done(null, false, { message: 'Esta cuenta usa Google. Inicia sesión con Google.' });
    }
    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return done(null, false, { message: 'Correo o contraseña incorrectos.' });
    return done(null, user);
  })
);

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      (accessToken, refreshToken, profile, done) => {
        const email =
          profile.emails && profile.emails[0]
            ? profile.emails[0].value.toLowerCase()
            : null;
        const name = profile.displayName || (email ? email.split('@')[0] : 'Usuario');
        const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

        let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(profile.id);
        if (!user && email) {
          user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
          if (user) {
            db.prepare('UPDATE users SET google_id = ?, name = ?, avatar = ? WHERE id = ?').run(
              profile.id,
              name,
              avatar,
              user.id
            );
            return done(null, user);
          }
        }
        if (!user) {
          const info = db
            .prepare('INSERT INTO users (email, google_id, name, avatar) VALUES (?, ?, ?, ?)')
            .run(email, profile.id, name, avatar);
          user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
        }
        return done(null, user);
      }
    )
  );
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  done(null, user || null);
});

module.exports = passport;
