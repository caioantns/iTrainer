import axios from 'axios';

const baseURL = import.meta.env.PROD
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3010/api');

// Access token em memoria (nao localStorage) — refresh fica em httpOnly cookie.
let accessToken = null;
const listeners = new Set();

export function setAccessToken(token) {
  accessToken = token || null;
  listeners.forEach((l) => l(accessToken));
}
export function getAccessToken() { return accessToken; }
export function onAuthChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const api = axios.create({
  baseURL,
  withCredentials: true, // envia cookie refresh
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Refresh logic: enfila chamadas concorrentes durante refresh.
let isRefreshing = false;
let refreshQueue = [];
function onRefreshed(newToken, err) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (err) reject(err); else resolve(newToken);
  });
  refreshQueue = [];
}

async function tryRefresh() {
  // Endpoint /refresh nao usa Authorization, so cookie.
  const resp = await axios.post(`${baseURL}/refresh`, null, { withCredentials: true });
  const newToken = resp.data?.accessToken;
  if (!newToken) throw new Error('Sem accessToken no refresh.');
  setAccessToken(newToken);
  return newToken;
}

api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const original = error.config || {};
    const status = error?.response?.status;

    // Nao tentar refresh em chamadas de auth/refresh/logout (evita loop)
    const url = original.url || '';
    const isAuthPath = /\/(login|cadastro|refresh|logout)\b/.test(url);

    if (status === 401 && !original._retry && !isAuthPath) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      isRefreshing = true;
      try {
        const newToken = await tryRefresh();
        onRefreshed(newToken, null);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        onRefreshed(null, refreshErr);
        setAccessToken(null);
        localStorage.removeItem('itrainer_user');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
