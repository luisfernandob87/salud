import { api } from '../api/client';
import { mockGet, mockPost, mockPut, mockDel, mockUpload } from './handlers';

const origGet = api.get;
const origPost = api.post;
const origPut = api.put;
const origDel = api.del;
const origUpload = api.upload;

function delay(ms = 80) {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 60));
}

function wrap(fn) {
  return async (...args) => {
    await delay();
    try {
      return await fn(...args);
    } catch (err) {
      if (err && err.status) throw err;
      console.error('[Mock]', err);
      throw Object.assign(new Error(err?.message || 'Error del servidor mock'), { status: 500 });
    }
  };
}

export function setupMocks() {
  api.get = wrap(mockGet);
  api.post = wrap(mockPost);
  api.put = wrap(mockPut);
  api.del = wrap(mockDel);
  api.upload = wrap(mockUpload);

  console.log(
    '%c🏥 Health App — Modo Demo %c(datos en memoria)',
    'background:#3b82f6;color:#fff;padding:4px 8px;border-radius:6px 0 0 6px;font-weight:bold',
    'background:#1e293b;color:#93c5fd;padding:4px 8px;border-radius:0 6px 6px 0',
  );
}

export function teardownMocks() {
  api.get = origGet;
  api.post = origPost;
  api.put = origPut;
  api.del = origDel;
  api.upload = origUpload;
}
