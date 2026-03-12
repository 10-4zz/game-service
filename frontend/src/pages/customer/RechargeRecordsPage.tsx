import { useEffect, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { paymentMethodLabelMap } from '../../lib/constants';
import { apiGet } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { RechargeRequest } from '../../types';

export function CustomerRechargeRecordsPage() {
  const [rows, setRows] = useState<RechargeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await apiGet<RechargeRequest[]>('/api/customer/recharge-requests');
      setRows(data);
      setLoading(false);
    }

    void load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="我的充值记录" description="查看所有充值申请及审核状态。" />
      {loading ? (
        <LoadingView />
      ) : (
        <DataTable
          data={rows}
          rowKey={(row) => row.id}
          columns={[
            { key: 'amount', title: '金额', render: (row) => formatCurrency(row.amount) },
            { key: 'payment', title: '支付方式', render: (row) => paymentMethodLabelMap[row.payment_method] },
            { key: 'status', title: '状态', render: (row) => <StatusBadge status={row.status} type="recharge" /> },
            { key: 'remark', title: '备注', render: (row) => row.remark || '-' },
            { key: 'review', title: '审核备注', render: (row) => row.review_remark || '-' },
            { key: 'created', title: '申请时间', render: (row) => formatDateTime(row.created_at) }
          ]}
        />
      )}
    </div>
  );
}
