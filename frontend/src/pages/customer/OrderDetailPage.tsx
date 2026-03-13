import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingView } from '../../components/LoadingView';
import { OrderDetailPanel } from '../../components/OrderDetailPanel';
import { canDeleteOrder } from '../../lib/constants';
import { apiDelete, apiGet, apiPost } from '../../lib/api';
import type { Order } from '../../types';

export function CustomerOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

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
  const canRetrySettlement =
    currentOrder.customer_completed &&
    currentOrder.worker_completed &&
    (currentOrder.status === 'completed' || currentOrder.status === 'pending_recharge');
  const canConfirmComplete =
    Boolean(currentOrder.worker_id) &&
    currentOrder.status !== 'pending_assignment' &&
    currentOrder.status !== 'cancelled' &&
    currentOrder.status !== 'settled' &&
    (!currentOrder.customer_completed || canRetrySettlement);

  async function handleDelete(targetOrder: Order) {
    const confirmed = window.confirm(`确认删除订单「${targetOrder.order_no}」吗？仅已结算或已取消订单允许删除。`);
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    try {
      await apiDelete(`/api/customer/orders/${targetOrder.id}`);
      window.alert('订单删除成功');
      navigate('/customer/orders', { replace: true });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeleting(false);
    }
  }

  async function handleComplete(targetOrder: Order) {
    setConfirming(true);
    try {
      const updatedOrder = await apiPost<Order>(`/api/customer/orders/${targetOrder.id}/complete`);
      setOrder(updatedOrder);
      const message =
        updatedOrder.status === 'settled'
          ? '双方已确认完成，订单已自动结算。'
          : updatedOrder.status === 'pending_recharge' && updatedOrder.customer_completed && updatedOrder.worker_completed
            ? '双方已确认完成，但当前余额不足，订单已转为待补余额。'
            : '你已确认完成，等待打手确认。';
      window.alert(message);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '确认失败');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <OrderDetailPanel
      order={currentOrder}
      backTo="/customer/orders"
      viewerRole="customer"
      actions={
        <>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void handleComplete(currentOrder)}
            disabled={confirming || !canConfirmComplete}
            title={canConfirmComplete ? '确认订单已完成' : '当前状态下不能确认完成'}
          >
            {canRetrySettlement
              ? confirming ? '处理中...' : '重新结算'
              : currentOrder.customer_completed
                ? '已确认完成'
                : confirming ? '确认中...' : '确认完成'}
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => void handleDelete(currentOrder)}
            disabled={deleting || !canDeleteOrder(currentOrder.status)}
            title={canDeleteOrder(currentOrder.status) ? '删除订单' : '仅已结算或已取消订单可删除'}
          >
            {deleting ? '删除中...' : '删除订单'}
          </button>
        </>
      }
    />
  );
}
