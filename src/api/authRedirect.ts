import { useAuthStore } from '@/stores/auth';

const LOGIN_PATH = '/login';

export function redirectToLogin() {
  useAuthStore.getState().clearAuth();

  if (window.location.pathname === LOGIN_PATH) return;

  const next = `${window.location.pathname}${window.location.search}`;
  const params = new URLSearchParams();
  if (next !== '/') params.set('next', next);
  window.location.assign(`${LOGIN_PATH}${params.size ? `?${params}` : ''}`);
}
