import { useEffect, useEffectEvent, useState } from 'react';
import { Card } from '../../components/Card';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { apiGet } from '../../lib/api';
import { formatCurrency } from '../../lib/format';
import type { WorkerDashboardData } from '../../types';

const DASHBOARD_REFRESH_INTERVAL = 15000;

export function WorkerDashboardPage() {
  const [data, setData] = useState<WorkerDashboardData | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useEffectEvent(async (silent = false) => {
    if (!silent) {
      setRefreshing(true);
    }
    try {
      const result = await apiGet<WorkerDashboardData>('/api/worker/dashboard');
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
        title="打手个人首页"
        description="查看自己的订单收入和结算进度；订单在双方确认完成后会自动进入结算。页面会在可见状态下每 15 秒自动刷新。"
        action={
          <button type="button" className="btn-secondary" onClick={() => void loadDashboard()} disabled={refreshing}>
            {refreshing ? '刷新中...' : '立即刷新'}
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard title="总收入" value={formatCurrency(data.totalIncome)} />
        <StatCard title="已结算" value={formatCurrency(data.settledAmount)} />
        <StatCard title="未结算" value={formatCurrency(data.unsettledAmount)} />
        <StatCard title="已提现" value={formatCurrency(data.withdrawnAmount)} />
        <StatCard title="待审核提现" value={formatCurrency(data.pendingWithdrawAmount)} />
        <StatCard title="可提现金额" value={formatCurrency(data.availableWithdrawAmount)} />
        <StatCard title="订单总数" value={String(data.orderCount)} />
      </div>
    </div>
  );
}
