require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer = require('multer');
const passport = require('./config/passport');
const { requireAuth, resolveProfile } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const timelineRoutes = require('./routes/timeline');
const symptomRoutes = require('./routes/symptoms');
const consultationRoutes = require('./routes/consultations');
const medicationRoutes = require('./routes/medications');
const studyRoutes = require('./routes/studies');
const noteRoutes = require('./routes/notes');
const dailyHealthRoutes = require('./routes/dailyHealth');
const fileRoutes = require('./routes/files');
const searchRoutes = require('./routes/search');
const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');
const shareRoutes = require('./routes/share');
const familyRoutes = require('./routes/family');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(passport.initialize());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/symptoms', requireAuth, resolveProfile, symptomRoutes);
app.use('/api/consultations', requireAuth, resolveProfile, consultationRoutes);
app.use('/api/medications', requireAuth, resolveProfile, medicationRoutes);
app.use('/api/studies', requireAuth, resolveProfile, studyRoutes);
app.use('/api/notes', requireAuth, resolveProfile, noteRoutes);
app.use('/api/daily', requireAuth, resolveProfile, dailyHealthRoutes);
app.use('/api/timeline', requireAuth, resolveProfile, timelineRoutes);
app.use('/api/search', requireAuth, resolveProfile, searchRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', requireAuth, resolveProfile, dashboardRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/family', familyRoutes);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Error de subida: ${err.message}` });
  }
  if (err && err.message === 'Formato no permitido. Usa imágenes, videos o PDF.') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server Health App escuchando en http://localhost:${PORT}`);
});
