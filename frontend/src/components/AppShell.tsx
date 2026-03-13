import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { navItemsByRole } from '../lib/constants';

export function AppShell() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  if (!user) {
    return null;
  }

  function isNavItemActive(to: string) {
    if (to === '/customer/orders/new') {
      return pathname === to;
    }

    if (to === '/customer/orders') {
      return pathname.startsWith('/customer/orders') && pathname !== '/customer/orders/new';
    }

    return pathname === to || pathname.startsWith(`${to}/`);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(194,65,12,0.14),_transparent_24%),radial-gradient(circle_at_85%_12%,_rgba(14,165,233,0.12),_transparent_22%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="relative overflow-hidden rounded-[30px] border border-slate-800 bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-5 py-6 text-slate-100 shadow-panel">
          <div className="pointer-events-none absolute -right-10 top-6 h-32 w-32 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_0%,transparent_35%)]" />
          <div className="relative border-b border-slate-800 pb-5">
            <span className="inline-flex rounded-full border border-orange-300/30 bg-orange-500/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-100">
              Control Room
            </span>
            <p className="mt-4 text-xs uppercase tracking-[0.28em] text-orange-200">Game Service Platform</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{user.displayName}</h1>
            <p className="mt-1 text-sm text-slate-300">{user.role}</p>
            <p className="mt-4 max-w-[14rem] text-sm leading-6 text-slate-300">
              管理订单流转、充值入账、打手分配与工资结算。
            </p>
          </div>

          <nav className="relative mt-6 flex flex-col gap-2">
            {navItemsByRole[user.role].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={`group flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm transition ${
                  isNavItemActive(item.to)
                    ? 'bg-[linear-gradient(90deg,#c2410c_0%,#ea580c_100%)] text-white shadow-[0_14px_28px_rgba(194,65,12,0.28)]'
                    : 'text-slate-200 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span className="font-medium">{item.label}</span>
                <span className="h-2 w-2 rounded-full bg-current opacity-50 transition group-hover:opacity-80" />
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => void logout()}
            className="relative mt-8 w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-medium text-slate-100 transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            退出登录
          </button>
        </aside>

        <main className="space-y-6">
          <header className="relative overflow-hidden rounded-[30px] border border-slate-200/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_58%,rgba(255,237,213,0.95)_100%)] px-6 py-6 shadow-panel">
            <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-orange-200/60 blur-3xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-800">
                  Cloudflare MVP
                </span>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">业务管理控制台</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                  用更清晰的视图管理客户充值、订单分配、服务项目和打手结算。
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">当前账号</p>
                <p className="mt-1 font-semibold text-slate-900">{user.username}</p>
              </div>
            </div>
          </header>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
