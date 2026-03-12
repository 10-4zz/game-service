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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(194,65,12,0.18),_transparent_32%),linear-gradient(180deg,_#0f172a_0%,_#1e293b_48%,_#f8fafc_48%,_#f8fafc_100%)] px-4 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="self-center text-white">
          <p className="text-sm uppercase tracking-[0.28em] text-orange-300">Game Service Platform</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight">
            游戏陪玩 / 代练 / 打手管理平台
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
            一个面向老板、打手与客户的 Cloudflare 全栈 MVP，覆盖充值审核、余额下单、
            订单分配、收入统计和工资结算。
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-sm text-slate-300">管理员</p>
              <p className="mt-2 text-lg font-semibold">订单、充值、结算总控</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-sm text-slate-300">打手</p>
              <p className="mt-2 text-lg font-semibold">只看自己的订单与工资</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-sm text-slate-300">客户</p>
              <p className="mt-2 text-lg font-semibold">充值、下单、查询状态</p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-panel backdrop-blur">
          <h2 className="text-2xl font-semibold text-ink">账号登录</h2>
          <p className="mt-2 text-sm text-steel">输入账号密码，系统会自动跳转到对应角色后台。</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-800">种子账号</p>
            <p className="mt-2">管理员：`admin / admin123456`</p>
            <p>打手：`worker_ares / worker123456`</p>
            <p>客户：`customer_kevin / customer123456`</p>
          </div>
        </div>
      </div>
    </div>
  );
}
