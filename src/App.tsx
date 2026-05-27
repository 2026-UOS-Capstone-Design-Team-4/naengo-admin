import {
  ChefHat,
  ClipboardList,
  LogIn,
  LogOut,
  type LucideIcon,
  MessageCircle,
  ShieldAlert,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router';

import { useAuthStore } from '@/stores/auth';

const NAV_ITEMS: Array<{ to: string; label: string; Icon: LucideIcon }> = [
  { to: '/', label: '채팅', Icon: MessageCircle },
  { to: '/admin/user-recipes', label: '제출 검수', Icon: ClipboardList },
  { to: '/admin/user-recipe-reports', label: '신고 검토', Icon: ShieldAlert },
  { to: '/admin/recipes', label: '운영 레시피', Icon: ChefHat },
];

export default function App() {
  const user = useAuthStore(state => state.user);
  const accessToken = useAuthStore(state => state.accessToken);
  const clearAuth = useAuthStore(state => state.clearAuth);
  const navigate = useNavigate();
  const isAdmin = Boolean(accessToken && user?.role === 'ADMIN');
  const visibleNavItems = isAdmin ? NAV_ITEMS : NAV_ITEMS.slice(0, 1);

  function handleLogout() {
    clearAuth();
    navigate('/login', { replace: true });
  }

  function handleLogin() {
    navigate('/login?next=/');
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <aside className="flex w-52 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <img
              src="/favicon.svg"
              alt="냉고"
              className="h-8 w-8 rounded-lg shadow-sm"
            />
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900">
                냉고
              </h1>
              <p className="text-[10px] text-slate-400">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {visibleNavItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-l-2 border-(--color-main) bg-(--color-lighter) text-(--color-main-ui)'
                    : 'border-l-2 border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-2 border-t border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-700">
              {user?.nickname ?? '게스트'}
            </p>
            <p className="text-[10px] text-slate-400">
              {isAdmin ? 'v0.1.0 · 내부용' : '로그인 없이 채팅 가능'}
            </p>
          </div>
          {isAdmin ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              <LogOut size={13} />
              로그아웃
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              <LogIn size={13} />
              로그인
            </button>
          )}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-4 md:p-5">
        <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
