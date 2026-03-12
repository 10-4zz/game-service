import { useEffect, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { apiGet } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { Settlement } from '../../types';

export function WorkerSettlementsPage() {
  const [rows, setRows] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await apiGet<Settlement[]>('/api/worker/settlements');
      setRows(data);
      setLoading(false);
    }

    void load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="工资结算" description="查看自己的结算金额、时间与备注。" />
      {loading ? (
        <LoadingView />
      ) : (
        <DataTable
          data={rows}
          rowKey={(row) => row.id}
          columns={[
            { key: 'amount', title: '结算金额', render: (row) => formatCurrency(row.amount) },
            { key: 'time', title: '结算时间', render: (row) => formatDateTime(row.settlement_time) },
            { key: 'remark', title: '备注', render: (row) => row.remark || '-' }
          ]}
        />
      )}
    </div>
  );
}
