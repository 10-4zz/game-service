import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { homePathByRole, loginPathByRole, roleLabelMap } from '../lib/constants';
import type { Role } from '../types';

interface LoginPageProps {
  role: Role;
}

const roleMeta: Record<
  Role,
  {
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    heroClass: string;
    badgeClass: string;
    buttonClass: string;
    linkClass: string;
    demoUsername: string;
    demoPassword: string;
    highlights: string[];
  }
> = {
  admin: {
    badge: 'Admin Console',
    title: '管理员登录',
    subtitle: '进入平台总控后台',
    description: '集中处理订单、充值审核、打手分配、工资结算和服务项目配置。',
    heroClass: 'border-slate-900 bg-slate-950 text-white',
    badgeClass: 'border-amber-300/30 bg-amber-400/15 text-amber-100',
    buttonClass: 'bg-slate-950 text-white hover:bg-slate-800 focus-visible:ring-slate-300',
    linkClass: 'text-amber-700 hover:text-amber-900',
    demoUsername: 'admin',
    demoPassword: 'admin123456',
    highlights: ['查看平台总览与累计资金', '审核充值申请并处理订单', '统一发起打手工资结算']
  },
  worker: {
    badge: 'Worker Desk',
    title: '打手登录',
    subtitle: '进入个人工作台',
    description: '只查看自己的陪玩记录、订单详情和工资结算，减少无关信息干扰。',
    heroClass: 'border-emerald-950 bg-emerald-950 text-white',
    badgeClass: 'border-emerald-200/30 bg-emerald-300/15 text-emerald-100',
    buttonClass: 'bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-emerald-200',
    linkClass: 'text-emerald-700 hover:text-emerald-900',
    demoUsername: 'worker_ares',
    demoPassword: 'worker123456',
    highlights: ['查看自己的订单和收入构成', '跟踪已结算与未结算金额', '按角色隔离数据访问范围']
  },
  customer: {
    badge: 'Customer Portal',
    title: '客户登录',
    subtitle: '进入下单与充值中心',
    description: '查看余额、提交充值申请、浏览服务项目并追踪自己的订单状态。',
    heroClass: 'border-sky-950 bg-sky-950 text-white',
    badgeClass: 'border-sky-200/30 bg-sky-300/15 text-sky-100',
    buttonClass: 'bg-sky-700 text-white hover:bg-sky-800 focus-visible:ring-sky-200',
    linkClass: 'text-sky-700 hover:text-sky-900',
    demoUsername: 'customer_kevin',
    demoPassword: 'customer123456',
    highlights: ['余额充足时可直接下单扣款', '查看充值审核状态和历史订单', '支持客户自主注册新账号']
  }
};

export function LoginPage({ role }: LoginPageProps) {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const meta = roleMeta[role];

  if (user) {
    return <Navigate to={homePathByRole[user.role]} replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const authUser = await login(username, password, role);
      navigate(homePathByRole[authUser.role], { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '登录失败');
    } finally {
      setSubmitting(false);
    }
  }

  const roleLinks = (Object.keys(loginPathByRole) as Role[]).filter((item) => item !== role);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#e2e8f0_0%,#f8fafc_42%,#ffffff_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <section className={`rounded-[32px] border px-8 py-10 shadow-[0_22px_50px_rgba(15,23,42,0.22)] ${meta.heroClass}`}>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${meta.badgeClass}`}
          >
            {meta.badge}
          </span>
          <p className="mt-6 text-sm font-medium uppercase tracking-[0.26em] text-white/80">Game Service Platform</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight lg:text-5xl">{meta.subtitle}</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/88">{meta.description}</p>

          <div className="mt-8 grid gap-3">
            {meta.highlights.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm leading-6 text-white"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[24px] border border-white/15 bg-white/8 p-5">
            <p className="text-sm font-semibold text-white">切换角色入口</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {roleLinks.map((item) => (
                <Link
                  key={item}
                  to={loginPathByRole[item]}
                  className="rounded-xl border border-white/15 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
                >
                  {roleLabelMap[item]}登录
                </Link>
              ))}
              {role !== 'customer' ? (
                <Link
                  to="/customer/register"
                  className="rounded-xl border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  客户注册
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white px-8 py-8 shadow-[0_22px_50px_rgba(148,163,184,0.18)]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm font-semibold text-slate-900">{meta.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              当前入口仅接受
              <span className="mx-1 font-semibold text-slate-950">{roleLabelMap[role]}</span>
              账号登录。若角色不匹配，系统会明确提示并拒绝登录。
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="label" htmlFor={`${role}-username`}>
                用户名
              </label>
              <input
                id={`${role}-username`}
                className="field"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label" htmlFor={`${role}-password`}>
                密码
              </label>
              <input
                id={`${role}-password`}
                type="password"
                className="field"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                autoComplete="current-password"
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
              className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 ${meta.buttonClass}`}
            >
              {submitting ? '登录中...' : `登录${roleLabelMap[role]}后台`}
            </button>
          </form>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">测试账号</p>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Username</p>
              <p className="mt-1 font-mono text-sm font-semibold text-slate-950">{meta.demoUsername}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">Password</p>
              <p className="mt-1 font-mono text-sm font-semibold text-slate-950">{meta.demoPassword}</p>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-700">
            {role === 'customer' ? (
              <p>
                还没有客户账号？
                <Link to="/customer/register" className={`ml-1 font-semibold ${meta.linkClass}`}>
                  立即注册
                </Link>
              </p>
            ) : (
              <p>
                {roleLabelMap[role]}账号由平台管理员统一创建。如果你需要新账号，请联系管理员在后台新增。
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
