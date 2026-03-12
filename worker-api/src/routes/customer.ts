import { Hono } from 'hono';
import {
  execute,
  generateOrderNo,
  getOrderDetailForCustomer,
  getOrderSelectSql,
  getProductById,
  getWalletBalance,
  queryAll,
  queryFirst,
  roundMoney
} from '../db';
import { authRequired, requireRole } from '../middleware';
import type { AppEnv } from '../types';
import { fail, ok } from '../utils/response';
import { toOptionalString, toPositiveNumber, toTrimmedString } from '../utils/validation';

const customerRoutes = new Hono<AppEnv>();

customerRoutes.use('*', authRequired, requireRole('customer'));

customerRoutes.get('/dashboard', async (c) => {
  const authUser = c.get('authUser')!;
  const balance = await getWalletBalance(c.env.DB, authUser.id);
  const rechargeTotalRow = await queryFirst<{ total: number | null }>(
    c.env.DB,
    `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM recharge_requests
      WHERE user_id = ? AND status = 'approved'
    `,
    [authUser.id]
  );
  const orderCountRow = await queryFirst<{ total: number }>(
    c.env.DB,
    `SELECT COUNT(*) AS total FROM orders WHERE customer_id = ?`,
    [authUser.id]
  );
  const progressCountRow = await queryFirst<{ total: number }>(
    c.env.DB,
    `
      SELECT COUNT(*) AS total
      FROM orders
      WHERE customer_id = ? AND status IN ('pending_assignment', 'in_progress')
    `,
    [authUser.id]
  );
  const rechargeStatusRows = await queryAll<{ status: string; total: number }>(
    c.env.DB,
    `
      SELECT status, COUNT(*) AS total
      FROM recharge_requests
      WHERE user_id = ?
      GROUP BY status
    `,
    [authUser.id]
  );

  const statusMap = {
    pending: 0,
    approved: 0,
    rejected: 0
  };

  for (const item of rechargeStatusRows) {
    if (item.status in statusMap) {
      statusMap[item.status as keyof typeof statusMap] = Number(item.total);
    }
  }

  return ok(c, {
    balance,
    cumulativeRecharge: roundMoney(Number(rechargeTotalRow?.total ?? 0)),
    rechargeStatus: statusMap,
    orderCount: Number(orderCountRow?.total ?? 0),
    inProgressCount: Number(progressCountRow?.total ?? 0)
  });
});

customerRoutes.get('/products', async (c) => {
  const rows = await queryAll(
    c.env.DB,
    `
      SELECT id, game_name, service_name, unit_price, commission_rate, description, is_active, created_at
      FROM service_products
      WHERE is_active = 1
      ORDER BY created_at DESC
    `
  );

  return ok(
    c,
    rows.map((item) => ({
      ...item,
      unit_price: roundMoney(Number(item.unit_price)),
      commission_rate: Number(item.commission_rate),
      is_active: Boolean(item.is_active)
    }))
  );
});

customerRoutes.post('/recharge-requests', async (c) => {
  const authUser = c.get('authUser')!;
  const body = await c.req.json().catch(() => ({}));
  const amount = toPositiveNumber(body.amount);
  const paymentMethod = toTrimmedString(body.payment_method);
  const remark = toOptionalString(body.remark);
  const voucherUrl = toOptionalString(body.voucher_url);

  if (amount === null || !['alipay', 'wechat'].includes(paymentMethod)) {
    return fail(c, 400, '请填写正确的充值金额和支付方式。');
  }

  const result = await execute(
    c.env.DB,
    `
      INSERT INTO recharge_requests (user_id, amount, payment_method, voucher_url, remark, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `,
    [authUser.id, roundMoney(amount), paymentMethod, voucherUrl, remark]
  );

  return ok(c, { id: Number(result.meta.last_row_id) }, 201, '充值申请已提交。');
});

customerRoutes.get('/recharge-requests', async (c) => {
  const authUser = c.get('authUser')!;
  const rows = await queryAll(
    c.env.DB,
    `
      SELECT id, amount, payment_method, voucher_url, remark, review_remark, status, reviewed_at, created_at
      FROM recharge_requests
      WHERE user_id = ?
      ORDER BY created_at DESC
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

customerRoutes.post('/orders', async (c) => {
  const authUser = c.get('authUser')!;
  const body = await c.req.json().catch(() => ({}));
  const productId = Number(body.product_id);
  const durationHours = toPositiveNumber(body.duration_hours);
  const remark = toOptionalString(body.remark);
  const orderTime = toTrimmedString(body.order_time) || new Date().toISOString();

  if (!Number.isInteger(productId) || productId <= 0 || durationHours === null) {
    return fail(c, 400, '请选择服务项目并填写时长。');
  }

  const product = await getProductById(c.env.DB, productId);

  if (!product || !product.is_active) {
    return fail(c, 400, '服务项目不存在或未启用。');
  }

  const unitPrice = roundMoney(Number(product.unit_price));
  const totalAmount = roundMoney(durationHours * unitPrice);
  const commissionAmount = roundMoney(totalAmount * Number(product.commission_rate));
  const workerIncome = roundMoney(totalAmount - commissionAmount);
  const balance = await getWalletBalance(c.env.DB, authUser.id);

  if (balance < totalAmount) {
    return fail(c, 400, '余额不足，请先充值。');
  }

  const orderNo = generateOrderNo();
  const insertResult = await execute(
    c.env.DB,
    `
      INSERT INTO orders (
        order_no,
        customer_id,
        worker_id,
        product_id,
        order_time,
        duration_hours,
        unit_price,
        total_amount,
        commission_amount,
        worker_income,
        status,
        remark
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 'pending_assignment', ?)
    `,
    [
      orderNo,
      authUser.id,
      productId,
      orderTime,
      durationHours,
      unitPrice,
      totalAmount,
      commissionAmount,
      workerIncome,
      remark
    ]
  );
  const orderId = Number(insertResult.meta.last_row_id);

  await execute(
    c.env.DB,
    `
      INSERT INTO wallet_transactions (
        user_id,
        type,
        amount,
        direction,
        related_order_id,
        remark
      ) VALUES (?, 'order_deduct', ?, 'out', ?, ?)
    `,
    [authUser.id, totalAmount, orderId, `订单 ${orderNo} 扣款。`]
  );

  const detail = await getOrderDetailForCustomer(c.env.DB, orderId, authUser.id);
  return ok(c, detail, 201, '订单创建成功。');
});

customerRoutes.get('/orders', async (c) => {
  const authUser = c.get('authUser')!;
  const rows = await queryAll(
    c.env.DB,
    `${getOrderSelectSql()} WHERE o.customer_id = ? ORDER BY o.created_at DESC`,
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

customerRoutes.get('/orders/:id', async (c) => {
  const authUser = c.get('authUser')!;
  const orderId = Number(c.req.param('id'));
  const detail = await getOrderDetailForCustomer(c.env.DB, orderId, authUser.id);

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

export default customerRoutes;
