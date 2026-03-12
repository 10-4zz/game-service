import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { navItemsByRole } from '../lib/constants';

export function AppShell() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(194,65,12,0.10),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-white/70 bg-slate-950 px-5 py-6 text-slate-100 shadow-panel">
          <div className="border-b border-white/10 pb-5">
            <p className="text-xs uppercase tracking-[0.28em] text-orange-300">Game Service Platform</p>
            <h1 className="mt-2 text-xl font-semibold">{user.displayName}</h1>
            <p className="mt-1 text-sm text-slate-400">{user.role}</p>
          </div>

          <nav className="mt-6 flex flex-col gap-2">
            {navItemsByRole[user.role].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-sm transition ${
                    isActive
                      ? 'bg-orange-500/20 text-white ring-1 ring-orange-300/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => void logout()}
            className="mt-8 w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5"
          >
            退出登录
          </button>
        </aside>

        <main className="space-y-6">
          <header className="rounded-[28px] border border-white/70 bg-white/80 px-6 py-5 shadow-panel backdrop-blur">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-steel">Cloudflare MVP 后台</p>
                <h2 className="text-2xl font-semibold tracking-tight text-ink">业务管理控制台</h2>
              </div>
              <div className="text-sm text-slate-500">账号：{user.username}</div>
            </div>
          </header>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
