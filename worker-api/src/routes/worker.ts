import { Hono } from 'hono';
import {
  getOrderDetailForWorker,
  getOrderSelectSql,
  queryAll,
  queryFirst,
  roundMoney
} from '../db';
import { authRequired, requireRole } from '../middleware';
import type { AppEnv } from '../types';
import { fail, ok } from '../utils/response';

const workerRoutes = new Hono<AppEnv>();

workerRoutes.use('*', authRequired, requireRole('worker'));

workerRoutes.get('/dashboard', async (c) => {
  const authUser = c.get('authUser')!;
  const incomeRow = await queryFirst<{ total: number | null }>(
    c.env.DB,
    `
      SELECT COALESCE(SUM(worker_income), 0) AS total
      FROM orders
      WHERE worker_id = ? AND status != 'cancelled'
    `,
    [authUser.id]
  );
  const settledRow = await queryFirst<{ total: number | null }>(
    c.env.DB,
    `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM settlements
      WHERE worker_id = ?
    `,
    [authUser.id]
  );
  const orderCountRow = await queryFirst<{ total: number }>(
    c.env.DB,
    `
      SELECT COUNT(*) AS total
      FROM orders
      WHERE worker_id = ?
    `,
    [authUser.id]
  );

  const totalIncome = roundMoney(Number(incomeRow?.total ?? 0));
  const settledAmount = roundMoney(Number(settledRow?.total ?? 0));

  return ok(c, {
    totalIncome,
    settledAmount,
    unsettledAmount: roundMoney(totalIncome - settledAmount),
    orderCount: Number(orderCountRow?.total ?? 0)
  });
});

workerRoutes.get('/orders', async (c) => {
  const authUser = c.get('authUser')!;
  const rows = await queryAll(
    c.env.DB,
    `${getOrderSelectSql()} WHERE o.worker_id = ? ORDER BY o.created_at DESC`,
    [authUser.id]
  );

  return ok(
    c,
    rows.map((item) => ({
      ...item,
      unit_price: roundMoney(Number(item.unit_price)),
      total_amount: roundMoney(Number(item.total_amount)),
      commission_amount: roundMoney(Number(item.commission_amount)),
      worker_income: roundMoney(Number(item.worker_income))
    }))
  );
});

workerRoutes.get('/orders/:id', async (c) => {
  const authUser = c.get('authUser')!;
  const orderId = Number(c.req.param('id'));
  const detail = await getOrderDetailForWorker(c.env.DB, orderId, authUser.id);

  if (!detail) {
    return fail(c, 404, '订单不存在。', 'NOT_FOUND');
  }

  return ok(c, {
    ...detail,
    unit_price: roundMoney(Number(detail.unit_price)),
    total_amount: roundMoney(Number(detail.total_amount)),
    commission_amount: roundMoney(Number(detail.commission_amount)),
    worker_income: roundMoney(Number(detail.worker_income))
  });
});

workerRoutes.get('/settlements', async (c) => {
  const authUser = c.get('authUser')!;
  const rows = await queryAll(
    c.env.DB,
    `
      SELECT id, worker_id, amount, settlement_time, remark, created_at
      FROM settlements
      WHERE worker_id = ?
      ORDER BY settlement_time DESC
    `,
    [authUser.id]
  );

  return ok(
    c,
    rows.map((item) => ({
      ...item,
      amount: roundMoney(Number(item.amount))
    }))
  );
});

export default workerRoutes;
