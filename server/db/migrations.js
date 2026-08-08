const MIGRATIONS = [
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    name TEXT NOT NULL,
    avatar TEXT,
    birth_date TEXT,
    blood_type TEXT,
    height_cm REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS symptoms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    occurred_at TEXT NOT NULL,
    body_locations TEXT NOT NULL DEFAULT '[]',
    intensity INTEGER,
    kind TEXT,
    duration TEXT,
    causes TEXT,
    activity TEXT,
    relief TEXT,
    notes TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    visible_in_pdf INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_symptoms_user_date ON symptoms(user_id, occurred_at);
  `,
  `
  CREATE TABLE IF NOT EXISTS consultations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    specialty TEXT,
    doctor TEXT,
    place TEXT,
    reason TEXT,
    diagnosis TEXT,
    treatment TEXT,
    recommendations TEXT,
    next_appointment TEXT,
    notes TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    visible_in_pdf INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_consultations_user_date ON consultations(user_id, date);
  `,
  `
  CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    start_date TEXT,
    end_date TEXT,
    prescribed_by TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    reminder_at TEXT,
    notes TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    visible_in_pdf INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_medications_user ON medications(user_id);
  `,
  `
  CREATE TABLE IF NOT EXISTS studies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    category TEXT,
    description TEXT,
    observations TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    visible_in_pdf INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_studies_user_date ON studies(user_id, date);
  `,
  `
  CREATE TABLE IF NOT EXISTS daily_health (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    mood INTEGER,
    sleep_hours REAL,
    activity TEXT,
    weight_kg REAL,
    bp_sys INTEGER,
    bp_dia INTEGER,
    glucose REAL,
    temperature REAL,
    heart_rate INTEGER,
    spo2 INTEGER,
    notes TEXT,
    visible_in_pdf INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, date)
  );
  CREATE INDEX IF NOT EXISTS idx_daily_user_date ON daily_health(user_id, date);
  `,
  `
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime_type TEXT,
    size INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_files_entity ON files(entity_type, entity_id);
  `,
  `
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    title TEXT,
    content TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    visible_in_pdf INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_notes_user_date ON notes(user_id, date);
  `,
  `
  CREATE TABLE IF NOT EXISTS share_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_share_user ON share_links(user_id);
  `,
  `
  CREATE TABLE IF NOT EXISTS family_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guardian_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relation TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(profile_id, guardian_id)
  );
  CREATE INDEX IF NOT EXISTS idx_family_profile ON family_links(profile_id);
  CREATE INDEX IF NOT EXISTS idx_family_guardian ON family_links(guardian_id);
  `,
];

function ensureColumn(db, table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (cols.some((c) => c.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

function runMigrations(db) {
  db.exec('BEGIN');
  try {
    for (const sql of MIGRATIONS) {
      db.exec(sql);
    }
    ensureColumn(db, 'users', 'is_dependent', 'INTEGER NOT NULL DEFAULT 0');
    ensureColumn(db, 'users', 'family_code', 'TEXT');
    ensureColumn(db, 'users', 'claim_code', 'TEXT');
    ensureColumn(db, 'symptoms', 'visible_in_pdf', 'INTEGER NOT NULL DEFAULT 1');
    ensureColumn(db, 'consultations', 'visible_in_pdf', 'INTEGER NOT NULL DEFAULT 1');
    ensureColumn(db, 'medications', 'visible_in_pdf', 'INTEGER NOT NULL DEFAULT 1');
    ensureColumn(db, 'studies', 'visible_in_pdf', 'INTEGER NOT NULL DEFAULT 1');
    ensureColumn(db, 'daily_health', 'visible_in_pdf', 'INTEGER NOT NULL DEFAULT 1');
    ensureColumn(db, 'notes', 'visible_in_pdf', 'INTEGER NOT NULL DEFAULT 1');
    ensureColumn(db, 'share_links', 'date_from', 'TEXT');
    ensureColumn(db, 'share_links', 'date_to', 'TEXT');
    ensureColumn(db, 'share_links', 'types', 'TEXT');
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = { runMigrations };
