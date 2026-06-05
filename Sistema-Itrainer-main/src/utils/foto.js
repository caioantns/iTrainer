// Helper p/ resolver URL de foto: paths relativos /uploads/... precisam baseURL backend em dev.
const isProd = import.meta.env.PROD;
const API_HOST_DEV = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:3010';

export function resolveFotoUrl(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('/uploads/')) {
    return isProd ? url : `${API_HOST_DEV}${url}`;
  }
  return url;
}

export function fallbackAvatar(seed) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed || 'iTrainer')}&backgroundColor=4a90e2`;
}
