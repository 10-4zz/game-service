import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { homePathByRole } from '../lib/constants';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(username, password);
      navigate(homePathByRole[user.role], { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '登录失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(194,65,12,0.24),_transparent_24%),radial-gradient(circle_at_85%_18%,_rgba(14,165,233,0.16),_transparent_20%),linear-gradient(180deg,_#020617_0%,_#0f172a_42%,_#f8fafc_42%,_#f8fafc_100%)] px-4 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="self-center rounded-[34px] border border-slate-800 bg-slate-950/88 p-8 text-white shadow-[0_24px_60px_rgba(2,6,23,0.32)]">
          <span className="inline-flex rounded-full border border-orange-300/30 bg-orange-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-100">
            Control Room Access
          </span>
          <p className="mt-5 text-sm uppercase tracking-[0.28em] text-orange-200">Game Service Platform</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight lg:text-6xl">
            游戏陪玩 / 代练 / 打手管理平台
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-100">
            一个面向老板、打手与客户的 Cloudflare 全栈 MVP，覆盖充值审核、余额下单、
            订单分配、收入统计和工资结算。
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-slate-700 bg-slate-900 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.25)]">
              <p className="text-sm text-slate-200">管理员</p>
              <p className="mt-2 text-lg font-semibold text-white">订单、充值、结算总控</p>
            </div>
            <div className="rounded-[24px] border border-slate-700 bg-slate-900 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.25)]">
              <p className="text-sm text-slate-200">打手</p>
              <p className="mt-2 text-lg font-semibold text-white">只看自己的订单与工资</p>
            </div>
            <div className="rounded-[24px] border border-slate-700 bg-slate-900 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.25)]">
              <p className="text-sm text-slate-200">客户</p>
              <p className="mt-2 text-lg font-semibold text-white">充值、下单、查询状态</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[34px] border border-slate-200/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_100%)] p-8 shadow-panel">
          <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-orange-200/70 blur-3xl" />
          <h2 className="text-2xl font-semibold text-ink">账号登录</h2>
          <p className="mt-2 text-sm text-slate-700">输入账号密码，系统会自动跳转到对应角色后台。</p>

          <form className="relative mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="label" htmlFor="username">
                用户名
              </label>
              <input
                id="username"
                className="field"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="例如：admin"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                密码
              </label>
              <input
                id="password"
                type="password"
                className="field"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-8 rounded-[24px] border border-slate-300 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">种子账号</p>
            <div className="mt-3 space-y-2">
              <div className="rounded-xl border border-slate-300 bg-white px-3 py-2">
                <span className="font-semibold text-slate-900">管理员：</span>
                <span className="font-mono text-[13px]">admin / admin123456</span>
              </div>
              <div className="rounded-xl border border-slate-300 bg-white px-3 py-2">
                <span className="font-semibold text-slate-900">打手：</span>
                <span className="font-mono text-[13px]">worker_ares / worker123456</span>
              </div>
              <div className="rounded-xl border border-slate-300 bg-white px-3 py-2">
                <span className="font-semibold text-slate-900">客户：</span>
                <span className="font-mono text-[13px]">customer_kevin / customer123456</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
