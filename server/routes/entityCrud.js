const express = require('express');
const db = require('../db/database');
const { attachFiles, deleteFilesForEntity } = require('../services/fileService');

const JSON_FIELDS = new Set(['body_locations', 'tags']);

function normalizeValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return String(value).trim() === '' ? null : value;
}

function cleanBody(body, allowedFields) {
  const record = {};
  for (const field of allowedFields) {
    if (body[field] === undefined) continue;
    const value = body[field];
    if (JSON_FIELDS.has(field)) {
      record[field] = typeof value === 'string' ? value : JSON.stringify(value || []);
    } else {
      record[field] = normalizeValue(value);
    }
  }
  return record;
}

function makeCrudRouter({ table, type, allowedFields, orderField = 'date' }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const rows = db
      .prepare(`SELECT * FROM ${table} WHERE user_id = ? ORDER BY ${orderField} DESC, id DESC`)
      .all(req.profileId);
    for (const row of rows) {
      row.type = type;
      for (const f of JSON_FIELDS) {
        if (row[f] && typeof row[f] === 'string') {
          try { row[f] = JSON.parse(row[f]); } catch (err) { row[f] = []; }
        }
      }
    }
    res.json({ items: attachFiles(rows) });
  });

  router.get('/:id', (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`).get(req.params.id, req.profileId);
    if (!row) return res.status(404).json({ error: 'Registro no encontrado.' });
    row.type = type;
    for (const f of JSON_FIELDS) {
      if (row[f] && typeof row[f] === 'string') {
        try { row[f] = JSON.parse(row[f]); } catch (err) { row[f] = []; }
      }
    }
    res.json({ item: attachFiles([row])[0] });
  });

  router.post('/', (req, res) => {
    const record = cleanBody(req.body, allowedFields);
    const cols = Object.keys(record);
    const values = cols.map((c) => record[c]);
    const info = db
      .prepare(
        `INSERT INTO ${table} (user_id${cols.length ? ', ' + cols.join(', ') : ''}) VALUES (${'?'}${cols.length ? ', ' + cols.map(() => '?').join(', ') : ''})`
      )
      .run(req.profileId, ...values);
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid);
    row.type = type;
    for (const f of JSON_FIELDS) {
      if (row[f] && typeof row[f] === 'string') {
        try { row[f] = JSON.parse(row[f]); } catch (err) { row[f] = []; }
      }
    }
    res.status(201).json({ item: attachFiles([row])[0] });
  });

  router.put('/:id', (req, res) => {
    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`).get(req.params.id, req.profileId);
    if (!existing) return res.status(404).json({ error: 'Registro no encontrado.' });

    const record = cleanBody(req.body, allowedFields);
    const cols = Object.keys(record);
    if (cols.length === 0) return res.status(400).json({ error: 'Sin cambios.' });
    const setClause = cols.map((c) => `${c} = ?`).join(', ');
    db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ? AND user_id = ?`).run(
      ...cols.map((c) => record[c]),
      req.params.id,
      req.profileId
    );
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    row.type = type;
    for (const f of JSON_FIELDS) {
      if (row[f] && typeof row[f] === 'string') {
        try { row[f] = JSON.parse(row[f]); } catch (err) { row[f] = []; }
      }
    }
    res.json({ item: attachFiles([row])[0] });
  });

  router.delete('/:id', (req, res) => {
    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`).get(req.params.id, req.profileId);
    if (!existing) return res.status(404).json({ error: 'Registro no encontrado.' });
    db.prepare(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`).run(req.params.id, req.profileId);
    deleteFilesForEntity(req.profileId, type, req.params.id);
    res.json({ ok: true });
  });

  return router;
}

module.exports = { makeCrudRouter, cleanBody };
