import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { homePathByRole } from '../lib/constants';

export function CustomerRegisterPage() {
  const { registerCustomer, user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={homePathByRole[user.role]} replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }

    setSubmitting(true);
    try {
      await registerCustomer(username, password, displayName);
      navigate('/customer/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '注册失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#f8fafc_44%,#ffffff_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="rounded-[32px] border border-sky-950 bg-sky-950 px-8 py-10 text-white shadow-[0_22px_50px_rgba(12,74,110,0.26)]">
          <span className="inline-flex rounded-full border border-sky-200/30 bg-sky-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-100">
            Customer Register
          </span>
          <p className="mt-6 text-sm font-medium uppercase tracking-[0.26em] text-sky-100/85">Game Service Platform</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight lg:text-5xl">创建客户账号</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/88">
            注册后即可扫码充值、查看可下单服务项目，并在余额充足时直接完成下单。
          </p>

          <div className="mt-8 grid gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm leading-6 text-white">
              用户名规则：4 到 24 位字母、数字或下划线。
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm leading-6 text-white">
              显示名称规则：2 到 24 位，作为前端展示昵称。
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm leading-6 text-white">
              注册完成后会自动登录到客户后台，无需再次手动输入账号密码。
            </div>
          </div>

          <div className="mt-10 rounded-[24px] border border-white/15 bg-white/8 p-5">
            <p className="text-sm font-semibold text-white">其他入口</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                to="/customer/login"
                className="rounded-xl border border-white/15 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                客户登录
              </Link>
              <Link
                to="/admin/login"
                className="rounded-xl border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                管理员登录
              </Link>
              <Link
                to="/worker/login"
                className="rounded-xl border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                打手登录
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white px-8 py-8 shadow-[0_22px_50px_rgba(148,163,184,0.18)]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm font-semibold text-slate-900">客户注册</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              该页面仅用于创建客户账号。管理员和打手账号仍由平台管理员在后台统一创建。
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="label" htmlFor="display-name">
                显示名称
              </label>
              <input
                id="display-name"
                className="field"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="例如：新客户"
                autoComplete="nickname"
              />
            </div>

            <div>
              <label className="label" htmlFor="register-username">
                用户名
              </label>
              <input
                id="register-username"
                className="field"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="仅支持字母、数字、下划线"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label" htmlFor="register-password">
                密码
              </label>
              <input
                id="register-password"
                type="password"
                className="field"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="至少 6 位"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="label" htmlFor="register-confirm-password">
                确认密码
              </label>
              <input
                id="register-confirm-password"
                type="password"
                className="field"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="再次输入密码"
                autoComplete="new-password"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
            >
              {submitting ? '注册中...' : '注册并进入客户后台'}
            </button>
          </form>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-700">
            已有客户账号？
            <Link to="/customer/login" className="ml-1 font-semibold text-sky-700 hover:text-sky-900">
              去登录
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
