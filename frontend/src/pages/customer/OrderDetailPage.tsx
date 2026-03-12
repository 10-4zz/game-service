import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingView } from '../../components/LoadingView';
import { OrderDetailPanel } from '../../components/OrderDetailPanel';
import { canDeleteOrder } from '../../lib/constants';
import { apiDelete, apiGet } from '../../lib/api';
import type { Order } from '../../types';

export function CustomerOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await apiGet<Order>(`/api/customer/orders/${id}`);
      setOrder(data);
    }

    void load();
  }, [id]);

  if (!order) {
    return <LoadingView />;
  }

  const currentOrder = order;

  async function handleDelete() {
    const confirmed = window.confirm(`确认删除订单「${currentOrder.order_no}」吗？仅已结算或已取消订单允许删除。`);
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    try {
      await apiDelete(`/api/customer/orders/${currentOrder.id}`);
      window.alert('订单删除成功');
      navigate('/customer/orders', { replace: true });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <OrderDetailPanel
      order={currentOrder}
      backTo="/customer/orders"
      viewerRole="customer"
      actions={
        <button
          type="button"
          className="btn-danger"
          onClick={() => void handleDelete()}
          disabled={deleting || !canDeleteOrder(currentOrder.status)}
          title={canDeleteOrder(currentOrder.status) ? '删除订单' : '仅已结算或已取消订单可删除'}
        >
          {deleting ? '删除中...' : '删除订单'}
        </button>
      }
    />
  );
}
