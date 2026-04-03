// Koment: Wrapper i centralizuar per thirrjet API me cookies/session aktive.
function isFormData(value) {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

function normalizeBody(body) {
  if (body === undefined) {
    return undefined;
  }

  if (isFormData(body)) {
    return body;
  }

  return JSON.stringify(body ?? {});
}

async function request(path, options = {}) {
  const body = normalizeBody(options.body);
  const headers = { ...(options.headers || {}) };

  if (!isFormData(body) && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers,
    body
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (_error) {
    data = { success: false, message: text || 'Pergjigje e pavlefshme nga serveri.' };
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Gabim ne API');
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' })
};

window.PlatformaApi = api;
