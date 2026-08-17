import {
  MOCK_USER, MOCK_PROFILES, MOCK_SYMPTOMS, MOCK_CONSULTATIONS,
  MOCK_MEDICATIONS, MOCK_STUDIES, MOCK_NOTES, MOCK_SHARE_LINKS,
  generateDailyRecords, nextId,
} from './data';

const symptoms = [...MOCK_SYMPTOMS];
const consultations = [...MOCK_CONSULTATIONS];
const medications = [...MOCK_MEDICATIONS];
const studies = [...MOCK_STUDIES];
const notes = [...MOCK_NOTES];
const dailyRecords = generateDailyRecords();
const shareLinks = [...MOCK_SHARE_LINKS];
const files = [];
let profiles = [...MOCK_PROFILES];
let user = { ...MOCK_USER };

function parseJson(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
  return [];
}

function itemDate(item) {
  return (item.occurred_at || item.date || item.start_date || '').slice(0, 10);
}

function allTimelineItems() {
  const items = [
    ...symptoms.map((s) => ({ ...s, type: 'symptom', date: s.occurred_at?.slice(0, 10), body_locations: parseJson(s.body_locations), tags: parseJson(s.tags), files: files.filter((f) => f.entity_type === 'symptom' && f.entity_id === s.id) })),
    ...consultations.map((c) => ({ ...c, type: 'consultation', tags: parseJson(c.tags), files: files.filter((f) => f.entity_type === 'consultation' && f.entity_id === c.id) })),
    ...medications.map((m) => ({ ...m, type: 'medication', tags: parseJson(m.tags), files: [] })),
    ...studies.map((s) => ({ ...s, type: 'study', tags: parseJson(s.tags), files: files.filter((f) => f.entity_type === 'study' && f.entity_id === s.id) })),
    ...dailyRecords.map((d) => ({ ...d, type: 'daily', date: d.date })),
    ...notes.map((n) => ({ ...n, type: 'note', tags: parseJson(n.tags) })),
  ];
  return items.sort((a, b) => {
    const da = (a.occurred_at || a.date || a.start_date || '');
    const db = (b.occurred_at || b.date || b.start_date || '');
    return db > da ? 1 : db < da ? -1 : 0;
  });
}

function upsertDaily(body) {
  const date = body.date;
  const idx = dailyRecords.findIndex((d) => d.date === date);
  if (idx >= 0) {
    const existing = dailyRecords[idx];
    dailyRecords[idx] = { ...existing, ...body, updated_at: new Date().toISOString() };
    return dailyRecords[idx];
  }
  const next = {
    id: nextId(), user_id: 1, date,
    mood: null, sleep_hours: null, activity: '', weight_kg: null,
    bp_sys: null, bp_dia: null, glucose: null, temperature: null,
    heart_rate: null, spo2: null, notes: '', visible_in_pdf: 1,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    ...body,
  };
  dailyRecords.push(next);
  return next;
}

function crudCollection(collection) {
  return {
    list() {
      return { items: collection.map((item) => ({
        ...item,
        body_locations: parseJson(item.body_locations),
        tags: parseJson(item.tags),
        files: files.filter((f) => f.entity_type === getType(collection) && f.entity_id === item.id),
      })) };
    },
    get(id) {
      const item = collection.find((i) => i.id === id);
      if (!item) throw Object.assign(new Error('No encontrado'), { status: 404 });
      return { item: { ...item, tags: parseJson(item.tags), body_locations: parseJson(item.body_locations), files: files.filter((f) => f.entity_id === id) } };
    },
    create(body) {
      const id = nextId();
      const now = new Date().toISOString();
      const item = { id, user_id: 1, ...body, created_at: now };
      if (item.body_locations && typeof item.body_locations !== 'string') item.body_locations = JSON.stringify(item.body_locations);
      if (item.tags && Array.isArray(item.tags)) item.tags = JSON.stringify(item.tags);
      collection.push(item);
      return { item: { ...item, tags: parseJson(item.tags), body_locations: parseJson(item.body_locations) } };
    },
    update(id, body) {
      const idx = collection.findIndex((i) => i.id === id);
      if (idx === -1) throw Object.assign(new Error('No encontrado'), { status: 404 });
      const updated = { ...collection[idx], ...body };
      if (updated.body_locations && typeof updated.body_locations !== 'string') updated.body_locations = JSON.stringify(updated.body_locations);
      if (updated.tags && Array.isArray(updated.tags)) updated.tags = JSON.stringify(updated.tags);
      collection[idx] = updated;
      return { item: { ...updated, tags: parseJson(updated.tags), body_locations: parseJson(updated.body_locations) } };
    },
    remove(id) {
      const idx = collection.findIndex((i) => i.id === id);
      if (idx === -1) throw Object.assign(new Error('No encontrado'), { status: 404 });
      collection.splice(idx, 1);
      return { ok: true };
    },
  };
}

function getType(col) {
  if (col === symptoms) return 'symptom';
  if (col === consultations) return 'consultation';
  if (col === medications) return 'medication';
  if (col === studies) return 'study';
  if (col === notes) return 'note';
  return 'unknown';
}

const symptomsCrud = crudCollection(symptoms);
const consultationsCrud = crudCollection(consultations);
const medicationsCrud = crudCollection(medications);
const studiesCrud = crudCollection(studies);
const notesCrud = crudCollection(notes);

function parseBody(url) {
  const idx = url.indexOf('?');
  return idx >= 0 ? url.slice(0, idx) : url;
}

function matchRoute(pattern, pathname) {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

export function mockGet(url) {
  const pathname = parseBody(url);
  const queryStr = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  const query = Object.fromEntries(new URLSearchParams(queryStr));

  if (pathname === '/api/auth/me') {
    return { user };
  }
  if (pathname === '/api/family') {
    return { profiles };
  }
  if (pathname === '/api/dashboard') {
    const sorted = [...dailyRecords].sort((a, b) => b.date > a.date ? 1 : b.date < a.date ? -1 : 0);
    const latestDaily = sorted.slice(0, 1);
    const latestSymptoms = [...symptoms].sort((a, b) => b.occurred_at > a.occurred_at ? 1 : -1).slice(0, 3);
    const activeMedications = medications.filter((m) => m.status === 'active');
    const futureConsultations = consultations.filter((c) => c.date >= new Date().toISOString().slice(0, 10) || c.next_appointment).sort((a, b) => (a.next_appointment || a.date) > (b.next_appointment || b.date) ? 1 : -1);
    const latestFiles = files.slice(-4);
    const hasData = symptoms.length > 0 || consultations.length > 0 || medications.length > 0;
    return { summary: { hasData, latestDaily, latestSymptoms, activeMedications, nextAppointments: futureConsultations, latestFiles } };
  }
  if (pathname === '/api/daily') {
    return { items: dailyRecords };
  }
  if (pathname === '/api/timeline') {
    return { items: allTimelineItems() };
  }
  if (pathname.startsWith('/api/search')) {
    const q = (query.q || '').toLowerCase();
    const match = (item) => {
      const texts = [
        item.notes, item.name, item.doctor, item.specialty, item.reason,
        item.diagnosis, item.description, item.title, item.content,
        item.category, item.kind, item.activity, item.place,
      ].filter(Boolean).join(' ').toLowerCase();
      const tags = parseJson(item.tags).join(' ').toLowerCase();
      const locations = parseJson(item.body_locations).join(' ').toLowerCase();
      return texts.includes(q) || tags.includes(q) || locations.includes(q);
    };
    const results = {
      symptom: symptoms.filter(match).map((s) => ({ ...s, type: 'symptom', date: s.occurred_at?.slice(0, 10), tags: parseJson(s.tags), body_locations: parseJson(s.body_locations) })),
      consultation: consultations.filter(match).map((c) => ({ ...c, type: 'consultation', tags: parseJson(c.tags) })),
      medication: medications.filter(match).map((m) => ({ ...m, type: 'medication', tags: parseJson(m.tags) })),
      study: studies.filter(match).map((s) => ({ ...s, type: 'study', tags: parseJson(s.tags) })),
      daily: dailyRecords.filter(match).map((d) => ({ ...d, type: 'daily' })),
      note: notes.filter(match).map((n) => ({ ...n, type: 'note', tags: parseJson(n.tags) })),
    };
    return { results };
  }
  if (pathname === '/api/share') {
    return { items: shareLinks };
  }
  if (pathname.startsWith('/api/share/public/')) {
    const token = pathname.split('/').pop();
    const link = shareLinks.find((l) => l.token === token);
    if (!link) throw Object.assign(new Error('Enlace no encontrado'), { status: 404 });
    if (link.expires_at && new Date(link.expires_at) < new Date()) throw Object.assign(new Error('Enlace expirado'), { status: 403 });
    const types = parseJson(link.types);
    const items = allTimelineItems().filter((i) => types.length === 0 || types.includes(i.type));
    return { user: { name: user.name, birth_date: user.birth_date, blood_type: user.blood_type }, items, range: { date_from: link.date_from, date_to: link.date_to }, types };
  }
  if (pathname === '/api/user/profile') {
    return { user };
  }

  const params = matchRoute('/api/symptoms/:id', pathname);
  if (params) return symptomsCrud.get(Number(params.id));
  if (pathname === '/api/symptoms') return symptomsCrud.list();

  const cparams = matchRoute('/api/consultations/:id', pathname);
  if (cparams) return consultationsCrud.get(Number(cparams.id));
  if (pathname === '/api/consultations') return consultationsCrud.list();

  const mparams = matchRoute('/api/medications/:id', pathname);
  if (mparams) return medicationsCrud.get(Number(mparams.id));
  if (pathname === '/api/medications') return medicationsCrud.list();

  const sparams = matchRoute('/api/studies/:id', pathname);
  if (sparams) return studiesCrud.get(Number(sparams.id));
  if (pathname === '/api/studies') return studiesCrud.list();

  const nparams = matchRoute('/api/notes/:id', pathname);
  if (nparams) return notesCrud.get(Number(nparams.id));
  if (pathname === '/api/notes') return notesCrud.list();

  const fparams = matchRoute('/api/files/:id', pathname);
  if (fparams) {
    const file = files.find((f) => f.id === Number(fparams.id));
    if (!file) throw Object.assign(new Error('Archivo no encontrado'), { status: 404 });
    return { file };
  }

  const famparams = matchRoute('/api/family/:id/family-code', pathname);
  if (famparams) {
    const code = 'FAM-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    return { code };
  }
  const claimparams = matchRoute('/api/family/:id/claim-code', pathname);
  if (claimparams) {
    const code = 'CLM-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    return { code };
  }

  console.warn('[Mock] GET no implementado:', url);
  return {};
}

export function mockPost(url, body) {
  const pathname = parseBody(url);

  if (pathname === '/api/auth/login') return { user };
  if (pathname === '/api/auth/register') return { user };
  if (pathname === '/api/auth/logout') return {};
  if (pathname === '/api/auth/google') return {};

  if (pathname === '/api/family') {
    const id = nextId();
    const newProfile = { id, is_dependent: 1, family_code: 'FAM-' + Math.random().toString(36).slice(2, 8).toUpperCase(), claim_code: 'CLM-' + Math.random().toString(36).slice(2, 8).toUpperCase(), ...body };
    profiles.push(newProfile);
    return { ok: true };
  }
  if (pathname === '/api/family/join') {
    return { profile: { id: nextId(), name: 'Familiar unido', relation: 'otro' } };
  }
  if (pathname === '/api/family/claim') {
    return { user };
  }

  if (pathname === '/api/share') {
    const id = nextId();
    const daysMap = { '24h': 1, '7d': 7, '30d': 30 };
    const rangeDaysMap = { '30d': 30, '3m': 90, '6m': 180, '1y': 365, 'all': 3650 };
    const exp = daysMap[body.expires] || 7;
    const rangeDays = rangeDaysMap[body.range] || 3650;
    const link = {
      id, user_id: 1,
      token: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
      password_hash: body.password ? 'hashed' : null,
      expires_at: new Date(Date.now() + exp * 86400000).toISOString(),
      created_at: new Date().toISOString(),
      date_from: new Date(Date.now() - rangeDays * 86400000).toISOString().slice(0, 10),
      date_to: new Date().toISOString().slice(0, 10),
      types: body.types ? JSON.stringify(body.types) : null,
    };
    shareLinks.unshift(link);
    return { item: link };
  }

  if (pathname === '/api/share/verify') {
    const link = shareLinks.find((l) => l.token === body.token);
    if (!link) throw Object.assign(new Error('Enlace no encontrado'), { status: 404 });
    return { ok: true };
  }

  if (pathname === '/api/symptoms') return symptomsCrud.create(body);
  if (pathname === '/api/consultations') return consultationsCrud.create(body);
  if (pathname === '/api/medications') return medicationsCrud.create(body);
  if (pathname === '/api/studies') return studiesCrud.create(body);
  if (pathname === '/api/notes') return notesCrud.create(body);

  console.warn('[Mock] POST no implementado:', url);
  return {};
}

export function mockPut(url, body) {
  const pathname = parseBody(url);

  if (pathname === '/api/daily') {
    return { item: upsertDaily(body) };
  }
  if (pathname === '/api/user/profile') {
    user = { ...user, ...body };
    const pidx = profiles.findIndex((p) => p.id === user.id);
    if (pidx >= 0) profiles[pidx] = { ...profiles[pidx], ...body };
    return { user };
  }
  if (pathname === '/api/user/password') {
    return { ok: true };
  }

  const params = matchRoute('/api/symptoms/:id', pathname);
  if (params) return symptomsCrud.update(Number(params.id), body);
  const cparams = matchRoute('/api/consultations/:id', pathname);
  if (cparams) return consultationsCrud.update(Number(cparams.id), body);
  const mparams = matchRoute('/api/medications/:id', pathname);
  if (mparams) return medicationsCrud.update(Number(mparams.id), body);
  const sparams = matchRoute('/api/studies/:id', pathname);
  if (sparams) return studiesCrud.update(Number(sparams.id), body);
  const nparams = matchRoute('/api/notes/:id', pathname);
  if (nparams) return notesCrud.update(Number(nparams.id), body);

  const famparams = matchRoute('/api/family/:id', pathname);
  if (famparams) {
    const idx = profiles.findIndex((p) => p.id === Number(famparams.id));
    if (idx >= 0) profiles[idx] = { ...profiles[idx], ...body };
    return { ok: true };
  }

  console.warn('[Mock] PUT no implementado:', url);
  return {};
}

export function mockDel(url) {
  const pathname = parseBody(url);

  if (pathname === '/api/user') {
    return { ok: true };
  }

  const dailyMatch = pathname.match(/^\/api\/daily\/(.+)$/);
  if (dailyMatch) {
    const date = dailyMatch[1];
    const idx = dailyRecords.findIndex((d) => d.date === date);
    if (idx >= 0) dailyRecords.splice(idx, 1);
    return { ok: true };
  }

  const params = matchRoute('/api/symptoms/:id', pathname);
  if (params) return symptomsCrud.remove(Number(params.id));
  const cparams = matchRoute('/api/consultations/:id', pathname);
  if (cparams) return consultationsCrud.remove(Number(cparams.id));
  const mparams = matchRoute('/api/medications/:id', pathname);
  if (mparams) return medicationsCrud.remove(Number(mparams.id));
  const sparams = matchRoute('/api/studies/:id', pathname);
  if (sparams) return studiesCrud.remove(Number(sparams.id));
  const nparams = matchRoute('/api/notes/:id', pathname);
  if (nparams) return notesCrud.remove(Number(nparams.id));

  const famparams = matchRoute('/api/family/:id', pathname);
  if (famparams) {
    profiles = profiles.filter((p) => p.id !== Number(famparams.id));
    return { ok: true };
  }

  const shareparams = matchRoute('/api/share/:id', pathname);
  if (shareparams) {
    const idx = shareLinks.findIndex((l) => l.id === Number(shareparams.id));
    if (idx >= 0) shareLinks.splice(idx, 1);
    return { ok: true };
  }

  const fileparams = matchRoute('/api/files/:id', pathname);
  if (fileparams) {
    const idx = files.findIndex((f) => f.id === Number(fileparams.id));
    if (idx >= 0) files.splice(idx, 1);
    return { ok: true };
  }

  console.warn('[Mock] DELETE no implementado:', pathname);
  return {};
}

export function mockUpload(url, formData) {
  if (url === '/api/files') {
    const id = nextId();
    const entity_type = formData.get?.('entity_type') || 'note';
    const entity_id = Number(formData.get?.('entity_id') || 0);
    const fileObj = formData.get?.('file');
    const name = fileObj?.name || 'archivo.bin';
    const mime = fileObj?.type || 'application/octet-stream';
    const file = { id, user_id: 1, entity_type, entity_id, original_name: name, stored_name: `demo-${id}`, mime_type: mime, size: fileObj?.size || 0, created_at: new Date().toISOString() };
    files.push(file);
    return { file };
  }
  return {};
}
