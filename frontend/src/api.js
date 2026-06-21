const BASE = 'http://localhost:3001';

export async function apiFetch(path, options = {}) {
  const url = BASE + path;
  const res = await fetch(url, { credentials: 'include', ...options });
  let body;
  try { body = await res.json(); } catch { body = null; }

  const headers = {};
  res.headers.forEach((v, k) => { headers[k] = v; });

  return {
    status: res.status,
    statusText: res.statusText,
    headers,
    body,
    ok: res.ok,
  };
}

export function buildRequest(method, path, { headers = {}, body } = {}) {
  return {
    method,
    url: BASE + path,
    headers,
    body: body ? JSON.parse(body) : undefined,
  };
}
