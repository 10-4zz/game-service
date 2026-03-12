import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { paymentMethodLabelMap } from '../../lib/constants';
import { apiGet } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { RechargeRequest } from '../../types';

export function AdminRechargeRecordsPage() {
  const [rows, setRows] = useState<RechargeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const customerIdFilter = searchParams.get('customerId');

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet<RechargeRequest[]>('/api/admin/recharge-requests');
        const filtered = data.filter((item) => {
          if (item.status === 'pending') {
            return false;
          }

          return customerIdFilter ? String(item.user_id) === customerIdFilter : true;
        });
        setRows(filtered);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : '加载失败');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [customerIdFilter]);

  return (
    <div className="space-y-6">
      <PageHeader title="充值记录" description="查看已审核的充值通过与拒绝记录。" />
      <Card title="说明">
        审核通过的记录会自动入账；拒绝记录会保留审核备注，便于后续复核。
      </Card>
      {loading ? (
        <LoadingView />
      ) : (
        <DataTable
          data={rows}
          rowKey={(row) => row.id}
          columns={[
            { key: 'user', title: '用户', render: (row) => row.user_name || '-' },
            { key: 'amount', title: '金额', render: (row) => formatCurrency(row.amount) },
            {
              key: 'payment',
              title: '支付方式',
              render: (row) => paymentMethodLabelMap[row.payment_method]
            },
            {
              key: 'status',
              title: '状态',
              render: (row) => <StatusBadge status={row.status} type="recharge" />
            },
            { key: 'review', title: '审核备注', render: (row) => row.review_remark || '-' },
            { key: 'reviewed_at', title: '审核时间', render: (row) => formatDateTime(row.reviewed_at) }
          ]}
        />
      )}
    </div>
  );
}
