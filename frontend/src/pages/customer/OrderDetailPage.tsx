import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingView } from '../../components/LoadingView';
import { OrderDetailPanel } from '../../components/OrderDetailPanel';
import { apiGet } from '../../lib/api';
import type { Order } from '../../types';

export function CustomerOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);

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

  return <OrderDetailPanel order={order} backTo="/customer/orders" viewerRole="customer" />;
}
