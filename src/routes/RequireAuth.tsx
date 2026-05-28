import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuthStore } from '@/stores/auth';

export default function RequireAuth() {
  const isDev = import.meta.env.DEV;
  const accessToken = useAuthStore(state => state.accessToken);
  const user = useAuthStore(state => state.user);
  const hasHydrated = useAuthStore(state => state.hasHydrated);
  const location = useLocation();

  if (isDev) {
    return <Outlet />;
  }

  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 text-sm font-semibold text-slate-500">
        인증 정보를 확인하는 중...
      </div>
    );
  }

  if (!accessToken || user?.role !== 'ADMIN') {
    const next = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
        replace
      />
    );
  }

  return <Outlet />;
}
