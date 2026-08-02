import { getActiveProfile } from '../utils/activeProfile';

function withProfile(url) {
  const id = getActiveProfile();
  if (!id) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}profile=${encodeURIComponent(id)}`;
}

async function request(method, url, body, isForm = false) {
  const opts = {
    method,
    credentials: 'include',
    headers: {},
  };
  if (body !== undefined) {
    if (isForm) {
      opts.body = body;
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(withProfile(url), opts);
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      data = { raw: text };
    }
  }
  if (!res.ok) {
    const message = (data && data.error) || `Error ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body),
  put: (url, body) => request('PUT', url, body),
  del: (url) => request('DELETE', url),
  upload: (url, formData) => request('POST', url, formData, true),
};

export function fileUrl(id, tokenOrParams) {
  const base = `/api/files/${id}`;
  const params = {};
  if (typeof tokenOrParams === 'string') {
    if (tokenOrParams) params.token = tokenOrParams;
  } else if (tokenOrParams) {
    Object.assign(params, tokenOrParams);
  }
  // Con sesión iniciada (sin token de enlace compartido), acotar al perfil activo.
  if (!params.token && getActiveProfile()) params.profile = getActiveProfile();
  const qs = new URLSearchParams(params).toString();
  return qs ? `${base}?${qs}` : base;
}

export function friendlyError(err) {
  return err && err.message ? err.message : 'Algo salió mal. Intenta de nuevo.';
}
