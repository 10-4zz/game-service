import { useEffect, useEffectEvent, useState } from 'react';
import { Card } from '../../components/Card';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { apiGet } from '../../lib/api';
import { formatCurrency } from '../../lib/format';
import type { CustomerDashboardData } from '../../types';

const DASHBOARD_REFRESH_INTERVAL = 15000;

export function CustomerDashboardPage() {
  const [data, setData] = useState<CustomerDashboardData | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useEffectEvent(async (silent = false) => {
    if (!silent) {
      setRefreshing(true);
    }
    try {
      const result = await apiGet<CustomerDashboardData>('/api/customer/dashboard');
      setData(result);
      setError('');
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '加载失败';
      if (!data) {
        setError(message);
      }
    } finally {
      if (!silent) {
        setRefreshing(false);
      }
    }
  });

  useEffect(() => {
    void loadDashboard();

    function handleFocus() {
      void loadDashboard(true);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void loadDashboard(true);
      }
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadDashboard(true);
      }
    }, DASHBOARD_REFRESH_INTERVAL);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (error) {
    return <Card title="加载失败">{error}</Card>;
  }

  if (!data) {
    return <LoadingView />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="用户首页"
        description="查看余额、充值入账状态和当前订单数量；订单在双方确认完成后才会正式扣减余额。页面会在可见状态下每 15 秒自动刷新。"
        action={
          <button type="button" className="btn-secondary" onClick={() => void loadDashboard()} disabled={refreshing}>
            {refreshing ? '刷新中...' : '立即刷新'}
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="当前余额" value={formatCurrency(data.balance)} />
        <StatCard title="累计充值" value={formatCurrency(data.cumulativeRecharge)} />
        <StatCard title="我的订单" value={String(data.orderCount)} />
        <StatCard title="进行中订单" value={String(data.inProgressCount)} />
      </div>
      <Card title="充值记录状态">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="待处理" value={String(data.rechargeStatus.pending)} />
          <StatCard title="已入账" value={String(data.rechargeStatus.approved)} />
          <StatCard title="已拒绝" value={String(data.rechargeStatus.rejected)} />
        </div>
      </Card>
    </div>
  );
}
