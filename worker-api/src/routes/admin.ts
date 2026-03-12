import { Hono } from 'hono';
import { sha256Hex } from '../auth';
import {
  execute,
  generateOrderNo,
  getOrderDetailById,
  getOrderSelectSql,
  getProductById,
  getUserById,
  getWalletBalance,
  queryAll,
  queryFirst,
  roundMoney
} from '../db';
import { authRequired, requireRole } from '../middleware';
import type { AppEnv, OrderStatus, RechargeStatus } from '../types';
import { fail, ok } from '../utils/response';
import {
  isNonEmptyString,
  parseBooleanFlag,
  toOptionalId,
  toOptionalString,
  toPositiveNumber,
  toTrimmedString
} from '../utils/validation';

const adminRoutes = new Hono<AppEnv>();
const mutableOrderStatuses: OrderStatus[] = ['pending_assignment', 'in_progress', 'completed', 'cancelled'];

adminRoutes.use('*', authRequired, requireRole('admin'));

adminRoutes.get('/dashboard', async (c) => {
  const platformBalanceRow = await queryFirst<{ total: number | null }>(
    c.env.DB,
    `
      SELECT COALESCE(SUM(balance), 0) AS total
      FROM (
        SELECT
          user_id,
          SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END) AS balance
        FROM wallet_transactions
        GROUP BY user_id
      ) wallet
      JOIN users u ON u.id = wallet.user_id
      WHERE u.role = 'customer'
    `
  );
  const cumulativeRechargeRow = await queryFirst<{ total: number | null }>(
    c.env.DB,
    `SELECT COALESCE(SUM(amount), 0) AS total FROM recharge_requests WHERE status = 'approved'`
  );
  const userCountRow = await queryFirst<{ total: number }>(
    c.env.DB,
    `SELECT COUNT(*) AS total FROM users WHERE role = 'customer'`
  );
  const workerCountRow = await queryFirst<{ total: number }>(
    c.env.DB,
    `SELECT COUNT(*) AS total FROM users WHERE role = 'worker'`
  );
  const orderCountRow = await queryFirst<{ total: number }>(
    c.env.DB,
    `SELECT COUNT(*) AS total FROM orders`
  );
  const settledAmountRow = await queryFirst<{ total: number | null }>(
    c.env.DB,
    `SELECT COALESCE(SUM(amount), 0) AS total FROM settlements`
  );
  const unsettledAmountRow = await queryFirst<{ total: number | null }>(
    c.env.DB,
    `
      SELECT COALESCE(SUM(worker_income), 0) AS total
      FROM orders
      WHERE worker_id IS NOT NULL
        AND status NOT IN ('settled', 'cancelled')
    `
  );

  return ok(c, {
    platformBalance: roundMoney(Number(platformBalanceRow?.total ?? 0)),
    cumulativeRecharge: roundMoney(Number(cumulativeRechargeRow?.total ?? 0)),
    userCount: Number(userCountRow?.total ?? 0),
    workerCount: Number(workerCountRow?.total ?? 0),
    orderCount: Number(orderCountRow?.total ?? 0),
    settledAmount: roundMoney(Number(settledAmountRow?.total ?? 0)),
    unsettledAmount: roundMoney(Number(unsettledAmountRow?.total ?? 0))
  });
});

adminRoutes.get('/users', async (c) => {
  const users = await queryAll<{
    id: number;
    username: string;
    display_name: string;
    created_at: string;
    balance: number;
    total_recharged: number;
    order_count: number;
  }>(
    c.env.DB,
    `
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.created_at,
        COALESCE((
          SELECT SUM(CASE WHEN wt.direction = 'in' THEN wt.amount ELSE -wt.amount END)
          FROM wallet_transactions wt
          WHERE wt.user_id = u.id
        ), 0) AS balance,
        COALESCE((
          SELECT SUM(rr.amount)
          FROM recharge_requests rr
          WHERE rr.user_id = u.id AND rr.status = 'approved'
        ), 0) AS total_recharged,
        COALESCE((
          SELECT COUNT(*)
          FROM orders o
          WHERE o.customer_id = u.id
        ), 0) AS order_count
      FROM users u
      WHERE u.role = 'customer'
      ORDER BY u.created_at DESC
    `
  );

  return ok(
    c,
    users.map((user) => ({
      ...user,
      balance: roundMoney(Number(user.balance)),
      total_recharged: roundMoney(Number(user.total_recharged))
    }))
  );
});

adminRoutes.post('/users', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const username = toTrimmedString(body.username);
  const password = toTrimmedString(body.password);
  const displayName = toTrimmedString(body.display_name);

  if (!isNonEmptyString(username) || !isNonEmptyString(password) || !isNonEmptyString(displayName)) {
    return fail(c, 400, '用户名、密码和显示名称均不能为空。');
  }

  const passwordHash = await sha256Hex(password);

  try {
    const result = await execute(
      c.env.DB,
      `
        INSERT INTO users (username, password_hash, role, display_name)
        VALUES (?, ?, 'customer', ?)
      `,
      [username, passwordHash, displayName]
    );

    return ok(c, { id: Number(result.meta.last_row_id) }, 201, '用户创建成功。');
  } catch (error) {
    return fail(c, 409, '用户名已存在或数据无效。', 'USER_CREATE_FAILED', String(error));
  }
});

adminRoutes.get('/workers', async (c) => {
  const workers = await queryAll<{
    id: number;
    username: string;
    display_name: string;
    created_at: string;
    order_count: number;
    total_income: number;
    settled_amount: number;
  }>(
    c.env.DB,
    `
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.created_at,
        COALESCE((SELECT COUNT(*) FROM orders o WHERE o.worker_id = u.id), 0) AS order_count,
        COALESCE((
          SELECT SUM(o.worker_income)
          FROM orders o
          WHERE o.worker_id = u.id AND o.status != 'cancelled'
        ), 0) AS total_income,
        COALESCE((
          SELECT SUM(s.amount)
          FROM settlements s
          WHERE s.worker_id = u.id
        ), 0) AS settled_amount
      FROM users u
      WHERE u.role = 'worker'
      ORDER BY u.created_at DESC
    `
  );

  return ok(
    c,
    workers.map((worker) => {
      const totalIncome = roundMoney(Number(worker.total_income));
      const settledAmount = roundMoney(Number(worker.settled_amount));

      return {
        ...worker,
        total_income: totalIncome,
        settled_amount: settledAmount,
        unsettled_amount: roundMoney(totalIncome - settledAmount)
      };
    })
  );
});

adminRoutes.post('/workers', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const username = toTrimmedString(body.username);
  const password = toTrimmedString(body.password);
  const displayName = toTrimmedString(body.display_name);

  if (!isNonEmptyString(username) || !isNonEmptyString(password) || !isNonEmptyString(displayName)) {
    return fail(c, 400, '用户名、密码和显示名称均不能为空。');
  }

  const passwordHash = await sha256Hex(password);

  try {
    const result = await execute(
      c.env.DB,
      `
        INSERT INTO users (username, password_hash, role, display_name)
        VALUES (?, ?, 'worker', ?)
      `,
      [username, passwordHash, displayName]
    );

    return ok(c, { id: Number(result.meta.last_row_id) }, 201, '打手创建成功。');
  } catch (error) {
    return fail(c, 409, '用户名已存在或数据无效。', 'WORKER_CREATE_FAILED', String(error));
  }
});

adminRoutes.get('/products', async (c) => {
  const products = await queryAll(
    c.env.DB,
    `
      SELECT id, game_name, service_name, unit_price, commission_rate, description, is_active, created_at
      FROM service_products
      ORDER BY is_active DESC, created_at DESC
    `
  );

  return ok(
    c,
    products.map((item) => ({
      ...item,
      unit_price: roundMoney(Number(item.unit_price)),
      commission_rate: Number(item.commission_rate),
      is_active: Boolean(item.is_active)
    }))
  );
});

adminRoutes.post('/products', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const gameName = toTrimmedString(body.game_name);
  const serviceName = toTrimmedString(body.service_name);
  const unitPrice = toPositiveNumber(body.unit_price);
  const commissionRateRaw = body.commission_rate ?? 0.2;
  const commissionRate = typeof commissionRateRaw === 'number' ? commissionRateRaw : Number(commissionRateRaw);
  const description = toOptionalString(body.description);
  const isActive = parseBooleanFlag(body.is_active, true);

  if (!isNonEmptyString(gameName) || !isNonEmptyString(serviceName) || unitPrice === null) {
    return fail(c, 400, '游戏名称、服务名称和单价不能为空。');
  }

  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate >= 1) {
    return fail(c, 400, '抽成比例必须在 0 到 1 之间。');
  }

  const result = await execute(
    c.env.DB,
    `
      INSERT INTO service_products (game_name, service_name, unit_price, commission_rate, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [gameName, serviceName, roundMoney(unitPrice), commissionRate, description, isActive ? 1 : 0]
  );

  return ok(c, { id: Number(result.meta.last_row_id) }, 201, '服务项目创建成功。');
});

adminRoutes.put('/products/:id', async (c) => {
  const productId = Number(c.req.param('id'));
  const existing = await getProductById(c.env.DB, productId);

  if (!existing) {
    return fail(c, 404, '服务项目不存在。', 'NOT_FOUND');
  }

  const body = await c.req.json().catch(() => ({}));
  const gameName = toTrimmedString(body.game_name) || existing.game_name;
  const serviceName = toTrimmedString(body.service_name) || existing.service_name;
  const unitPrice = toPositiveNumber(body.unit_price) ?? Number(existing.unit_price);
  const description =
    body.description === undefined ? existing.description : toOptionalString(body.description);
  const commissionRate =
    body.commission_rate === undefined ? Number(existing.commission_rate) : Number(body.commission_rate);
  const isActive =
    body.is_active === undefined ? Boolean(existing.is_active) : parseBooleanFlag(body.is_active);

  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate >= 1) {
    return fail(c, 400, '抽成比例必须在 0 到 1 之间。');
  }

  await execute(
    c.env.DB,
    `
      UPDATE service_products
      SET game_name = ?, service_name = ?, unit_price = ?, commission_rate = ?, description = ?, is_active = ?
      WHERE id = ?
    `,
    [gameName, serviceName, roundMoney(unitPrice), commissionRate, description, isActive ? 1 : 0, productId]
  );

  return ok(c, { id: productId }, 200, '服务项目更新成功。');
});

adminRoutes.get('/recharge-requests', async (c) => {
  const rows = await queryAll(
    c.env.DB,
    `
      SELECT
        rr.id,
        rr.user_id,
        rr.amount,
        rr.payment_method,
        rr.voucher_url,
        rr.remark,
        rr.review_remark,
        rr.status,
        rr.reviewed_by,
        rr.reviewed_at,
        rr.created_at,
        u.display_name AS user_name,
        reviewer.display_name AS reviewer_name
      FROM recharge_requests rr
      JOIN users u ON u.id = rr.user_id
      LEFT JOIN users reviewer ON reviewer.id = rr.reviewed_by
      ORDER BY rr.created_at DESC
    `
  );

  return ok(
    c,
    rows.map((row) => ({
      ...row,
      amount: roundMoney(Number(row.amount))
    }))
  );
});

adminRoutes.put('/recharge-requests/:id/review', async (c) => {
  const rechargeRequestId = Number(c.req.param('id'));
  const body = await c.req.json().catch(() => ({}));
  const status = body.status as RechargeStatus;
  const reviewRemark = toOptionalString(body.review_remark);
  const authUser = c.get('authUser');

  if (status !== 'approved' && status !== 'rejected') {
    return fail(c, 400, '审核状态只能是 approved 或 rejected。');
  }

  const request = await queryFirst<{
    id: number;
    user_id: number;
    amount: number;
    status: RechargeStatus;
  }>(
    c.env.DB,
    `
      SELECT id, user_id, amount, status
      FROM recharge_requests
      WHERE id = ?
    `,
    [rechargeRequestId]
  );

  if (!request) {
    return fail(c, 404, '充值申请不存在。', 'NOT_FOUND');
  }

  if (request.status !== 'pending') {
    return fail(c, 400, '该充值申请已经处理过了。');
  }

  const reviewedAt = new Date().toISOString();

  await execute(
    c.env.DB,
    `
      UPDATE recharge_requests
      SET status = ?, review_remark = ?, reviewed_by = ?, reviewed_at = ?
      WHERE id = ?
    `,
    [status, reviewRemark, authUser!.id, reviewedAt, rechargeRequestId]
  );

  if (status === 'approved') {
    await execute(
      c.env.DB,
      `
        INSERT INTO wallet_transactions (
          user_id,
          type,
          amount,
          direction,
          related_recharge_request_id,
          remark
        ) VALUES (?, 'recharge', ?, 'in', ?, ?)
      `,
      [request.user_id, roundMoney(Number(request.amount)), rechargeRequestId, '充值审核通过，自动入账。']
    );
  }

  return ok(c, { id: rechargeRequestId, status }, 200, '审核完成。');
});

adminRoutes.get('/orders', async (c) => {
  const rows = await queryAll(c.env.DB, `${getOrderSelectSql()} ORDER BY o.created_at DESC`);

  return ok(
    c,
    rows.map((item) => ({
      ...item,
      duration_hours: Number(item.duration_hours),
      unit_price: roundMoney(Number(item.unit_price)),
      total_amount: roundMoney(Number(item.total_amount)),
      commission_amount: roundMoney(Number(item.commission_amount)),
      worker_income: roundMoney(Number(item.worker_income))
    }))
  );
});

adminRoutes.get('/orders/:id', async (c) => {
  const orderId = Number(c.req.param('id'));
  const detail = await getOrderDetailById(c.env.DB, orderId);

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

adminRoutes.post('/orders', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const customerId = toOptionalId(body.customer_id);
  const workerId = toOptionalId(body.worker_id);
  const productId = toOptionalId(body.product_id);
  const durationHours = toPositiveNumber(body.duration_hours);
  const orderTime = toTrimmedString(body.order_time) || new Date().toISOString();
  const remark = toOptionalString(body.remark);
  const providedStatus = body.status as OrderStatus | undefined;
  const providedCommissionAmount =
    body.commission_amount === undefined ? null : Number(body.commission_amount);

  if (!customerId || !productId || durationHours === null) {
    return fail(c, 400, 'customer_id、product_id 和 duration_hours 必填。');
  }

  if (providedCommissionAmount !== null && (!Number.isFinite(providedCommissionAmount) || providedCommissionAmount < 0)) {
    return fail(c, 400, 'commission_amount 不能小于 0。');
  }

  if (providedStatus && !mutableOrderStatuses.includes(providedStatus)) {
    return fail(c, 400, '订单状态非法。');
  }

  const customer = await getUserById(c.env.DB, customerId);
  const product = await getProductById(c.env.DB, productId);

  if (!customer || customer.role !== 'customer') {
    return fail(c, 400, '客户不存在。');
  }

  if (!product) {
    return fail(c, 400, '服务项目不存在。');
  }

  if (workerId) {
    const worker = await getUserById(c.env.DB, workerId);
    if (!worker || worker.role !== 'worker') {
      return fail(c, 400, '打手不存在。');
    }
  }

  const unitPrice = roundMoney(Number(product.unit_price));
  const totalAmount = roundMoney(durationHours * unitPrice);
  const commissionAmount =
    providedCommissionAmount === null
      ? roundMoney(totalAmount * Number(product.commission_rate))
      : roundMoney(providedCommissionAmount);
  const workerIncome = roundMoney(totalAmount - commissionAmount);

  if (workerIncome < 0) {
    return fail(c, 400, '抽成金额不能大于订单总额。');
  }

  const walletBalance = await getWalletBalance(c.env.DB, customerId);

  if (walletBalance < totalAmount) {
    return fail(c, 400, '客户余额不足，无法创建订单。');
  }

  const status = providedStatus ?? (workerId ? 'in_progress' : 'pending_assignment');

  if (status !== 'pending_assignment' && status !== 'cancelled' && !workerId) {
    return fail(c, 400, '进行中或已完成订单必须指定打手。');
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      orderNo,
      customerId,
      workerId,
      productId,
      orderTime,
      durationHours,
      unitPrice,
      totalAmount,
      commissionAmount,
      workerIncome,
      status,
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
    [customerId, totalAmount, orderId, `订单 ${orderNo} 扣款。`]
  );

  const detail = await getOrderDetailById(c.env.DB, orderId);
  return ok(c, detail, 201, '订单创建成功。');
});

adminRoutes.put('/orders/:id', async (c) => {
  const orderId = Number(c.req.param('id'));
  const existing = await getOrderDetailById(c.env.DB, orderId);

  if (!existing) {
    return fail(c, 404, '订单不存在。', 'NOT_FOUND');
  }

  if (existing.status === 'settled') {
    return fail(c, 400, '已结算订单不允许修改。');
  }

  const body = await c.req.json().catch(() => ({}));
  const nextStatus = (body.status as OrderStatus | undefined) ?? existing.status;
  const nextWorkerId =
    body.worker_id === undefined ? existing.worker_id : toOptionalId(body.worker_id);
  const nextRemark =
    body.remark === undefined ? existing.remark : toOptionalString(body.remark);
  const nextOrderTime = toTrimmedString(body.order_time) || existing.order_time;

  if (existing.status === 'cancelled' && nextStatus !== 'cancelled') {
    return fail(c, 400, '已取消订单不支持重新激活。');
  }

  if (!mutableOrderStatuses.includes(nextStatus)) {
    return fail(c, 400, '订单状态非法。');
  }

  if (nextStatus === 'settled') {
    return fail(c, 400, '请通过结算接口完成 settled 状态更新。');
  }

  if (nextStatus !== 'pending_assignment' && nextStatus !== 'cancelled' && !nextWorkerId) {
    return fail(c, 400, '进行中或已完成订单必须指定打手。');
  }

  let productId = existing.product_id;
  let durationHours = Number(existing.duration_hours);
  let unitPrice = Number(existing.unit_price);
  let commissionAmount = Number(existing.commission_amount);

  if (nextStatus !== 'cancelled') {
    if (body.product_id !== undefined) {
      const requestedProductId = toOptionalId(body.product_id);
      if (!requestedProductId) {
        return fail(c, 400, 'product_id 无效。');
      }
      const product = await getProductById(c.env.DB, requestedProductId);
      if (!product) {
        return fail(c, 400, '服务项目不存在。');
      }
      productId = product.id;
      unitPrice = Number(product.unit_price);
      if (body.commission_amount === undefined) {
        commissionAmount = roundMoney(unitPrice * durationHours * Number(product.commission_rate));
      }
    }

    if (body.duration_hours !== undefined) {
      const parsedDuration = toPositiveNumber(body.duration_hours);
      if (parsedDuration === null) {
        return fail(c, 400, 'duration_hours 必须大于 0。');
      }
      durationHours = parsedDuration;
    }

    if (body.unit_price !== undefined) {
      const parsedUnitPrice = toPositiveNumber(body.unit_price);
      if (parsedUnitPrice === null) {
        return fail(c, 400, 'unit_price 必须大于 0。');
      }
      unitPrice = parsedUnitPrice;
    }

    if (body.commission_amount !== undefined) {
      const parsedCommission = Number(body.commission_amount);
      if (!Number.isFinite(parsedCommission) || parsedCommission < 0) {
        return fail(c, 400, 'commission_amount 不能小于 0。');
      }
      commissionAmount = parsedCommission;
    }
  }

  const totalAmount = roundMoney(durationHours * unitPrice);
  const roundedCommission = roundMoney(commissionAmount);
  const workerIncome = roundMoney(totalAmount - roundedCommission);

  if (workerIncome < 0) {
    return fail(c, 400, '抽成金额不能大于订单总额。');
  }

  if (nextStatus === 'cancelled') {
    const refunded = await queryFirst<{ total: number }>(
      c.env.DB,
      `
        SELECT COUNT(*) AS total
        FROM wallet_transactions
        WHERE related_order_id = ? AND type = 'refund'
      `,
      [orderId]
    );

    if (Number(refunded?.total ?? 0) === 0) {
      await execute(
        c.env.DB,
        `
          INSERT INTO wallet_transactions (user_id, type, amount, direction, related_order_id, remark)
          VALUES (?, 'refund', ?, 'in', ?, ?)
        `,
        [existing.customer_id, roundMoney(Number(existing.total_amount)), orderId, `订单 ${existing.order_no} 取消退款。`]
      );
    }
  } else {
    const delta = roundMoney(totalAmount - Number(existing.total_amount));
    if (delta > 0) {
      const balance = await getWalletBalance(c.env.DB, existing.customer_id);
      if (balance < delta) {
        return fail(c, 400, '客户余额不足，无法完成订单调价。');
      }
      await execute(
        c.env.DB,
        `
          INSERT INTO wallet_transactions (user_id, type, amount, direction, related_order_id, remark)
          VALUES (?, 'adjust', ?, 'out', ?, ?)
        `,
        [existing.customer_id, delta, orderId, `订单 ${existing.order_no} 调整补扣。`]
      );
    } else if (delta < 0) {
      await execute(
        c.env.DB,
        `
          INSERT INTO wallet_transactions (user_id, type, amount, direction, related_order_id, remark)
          VALUES (?, 'refund', ?, 'in', ?, ?)
        `,
        [existing.customer_id, Math.abs(delta), orderId, `订单 ${existing.order_no} 调整退款。`]
      );
    }
  }

  await execute(
    c.env.DB,
    `
      UPDATE orders
      SET worker_id = ?, product_id = ?, order_time = ?, duration_hours = ?, unit_price = ?,
          total_amount = ?, commission_amount = ?, worker_income = ?, status = ?, remark = ?
      WHERE id = ?
    `,
    [
      nextWorkerId,
      productId,
      nextOrderTime,
      durationHours,
      roundMoney(unitPrice),
      totalAmount,
      roundedCommission,
      workerIncome,
      nextStatus,
      nextRemark,
      orderId
    ]
  );

  const detail = await getOrderDetailById(c.env.DB, orderId);
  return ok(c, detail, 200, '订单更新成功。');
});

adminRoutes.get('/settlements', async (c) => {
  const rows = await queryAll(
    c.env.DB,
    `
      SELECT
        s.id,
        s.worker_id,
        s.amount,
        s.settlement_time,
        s.remark,
        s.created_at,
        u.display_name AS worker_name,
        COALESCE((SELECT COUNT(*) FROM orders o WHERE o.settlement_id = s.id), 0) AS orders_count
      FROM settlements s
      JOIN users u ON u.id = s.worker_id
      ORDER BY s.settlement_time DESC
    `
  );

  return ok(
    c,
    rows.map((item) => ({
      ...item,
      amount: roundMoney(Number(item.amount))
    }))
  );
});

adminRoutes.post('/settlements', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const workerId = toOptionalId(body.worker_id);
  const remark = toOptionalString(body.remark);

  if (!workerId) {
    return fail(c, 400, 'worker_id 必填。');
  }

  const worker = await getUserById(c.env.DB, workerId);
  if (!worker || worker.role !== 'worker') {
    return fail(c, 400, '打手不存在。');
  }

  const pendingOrders = await queryAll<{
    id: number;
    worker_income: number;
  }>(
    c.env.DB,
    `
      SELECT id, worker_income
      FROM orders
      WHERE worker_id = ?
        AND status = 'completed'
      ORDER BY created_at ASC
    `,
    [workerId]
  );

  if (pendingOrders.length === 0) {
    return fail(c, 400, '当前没有可结算的已完成订单。');
  }

  const totalAmount = roundMoney(
    pendingOrders.reduce((sum, order) => sum + Number(order.worker_income), 0)
  );
  const settlementTime = new Date().toISOString();
  const insertResult = await execute(
    c.env.DB,
    `
      INSERT INTO settlements (worker_id, amount, settlement_time, remark)
      VALUES (?, ?, ?, ?)
    `,
    [workerId, totalAmount, settlementTime, remark]
  );
  const settlementId = Number(insertResult.meta.last_row_id);

  for (const order of pendingOrders) {
    await execute(
      c.env.DB,
      `
        UPDATE orders
        SET status = 'settled', settlement_id = ?
        WHERE id = ?
      `,
      [settlementId, order.id]
    );
  }

  return ok(
    c,
    {
      id: settlementId,
      worker_id: workerId,
      amount: totalAmount,
      orders_count: pendingOrders.length
    },
    201,
    '结算成功。'
  );
});

export default adminRoutes;
