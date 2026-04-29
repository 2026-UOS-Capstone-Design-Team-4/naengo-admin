import { NavLink, Outlet } from 'react-router';

const NAV_ITEMS = [
  { to: '/', label: '💬 채팅' },
  { to: '/admin', label: '⚙️ 관리' },
];

export default function App() {
  return (
    <div className="flex h-screen bg-(--color-lighter)">
      {/* Sidebar */}
      <aside className="flex w-48 flex-col bg-(--color-main) text-white">
        <div className="p-5">
          <h1 className="text-lg font-bold">🧊 냉고</h1>
          <p className="mt-0.5 text-xs opacity-70">Naengo Admin</p>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-white/20'
                    : 'opacity-70 hover:bg-white/10 hover:opacity-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-4 md:p-6">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-(--color-main-bg) shadow-xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
