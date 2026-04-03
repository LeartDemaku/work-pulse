function ensureApi() {
  if (!window.PlatformaApi) {
    throw new Error('PlatformaApi nuk eshte inicializuar. Ngarko script/shared/api.js para auth.js.');
  }
  return window.PlatformaApi;
}

async function me() {
  const api = ensureApi();
  try {
    const data = await api.get('/api/auth/me');
    return data.user || null;
  } catch (_error) {
    return null;
  }
}

async function login(email, password) {
  const api = ensureApi();
  const data = await api.post('/api/auth/login', { email, password });
  return data.user;
}

async function register(payload) {
  const api = ensureApi();
  const data = await api.post('/api/auth/register', payload);
  return data.user;
}

async function logout() {
  const api = ensureApi();
  await api.post('/api/auth/logout', {});
}

async function requireAuth(role) {
  const user = await me();
  if (!user) {
    window.location.href = 'signin.html';
    return null;
  }

  if (role && user.role !== role) {
    window.location.href = 'index.html';
    return null;
  }

  return user;
}

window.PlatformaAuth = {
  me,
  login,
  register,
  logout,
  requireAuth
};