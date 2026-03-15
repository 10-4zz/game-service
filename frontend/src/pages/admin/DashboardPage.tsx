import { useEffect, useEffectEvent, useState } from 'react';
import { Card } from '../../components/Card';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { apiGet } from '../../lib/api';
import { formatCurrency } from '../../lib/format';
import type { AdminDashboardData } from '../../types';

const DASHBOARD_REFRESH_INTERVAL = 15000;

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useEffectEvent(async (silent = false) => {
    if (!silent) {
      setRefreshing(true);
    }
    try {
      const response = await apiGet<AdminDashboardData>('/api/admin/dashboard');
      setData(response);
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
        title="老板仪表盘"
        description="查看平台当前资金、订单和结算总览。页面会在可见状态下每 15 秒自动刷新。"
        action={
          <button type="button" className="btn-secondary" onClick={() => void loadDashboard()} disabled={refreshing}>
            {refreshing ? '刷新中...' : '立即刷新'}
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="平台余额" value={formatCurrency(data.platformBalance)} />
        <StatCard title="累计充值" value={formatCurrency(data.cumulativeRecharge)} />
        <StatCard title="用户总数" value={String(data.userCount)} />
        <StatCard title="打手总数" value={String(data.workerCount)} />
        <StatCard title="订单总数" value={String(data.orderCount)} />
        <StatCard title="已结算金额" value={formatCurrency(data.settledAmount)} />
        <StatCard title="未结算金额" value={formatCurrency(data.unsettledAmount)} />
      </div>
    </div>
  );
}
