/**
 * Cloudflare Worker Dashboard single-file version
 *
 * Required:
 * - D1 binding: DB
 * - Environment variable: JWT_SECRET
 * - Optional environment variable: FRONTEND_ORIGIN
 */

const ORDER_STATUSES = [
  'pending_recharge',
  'pending_assignment',
  'in_progress',
  'completed',
  'settled',
  'cancelled'
];
const DELETABLE_ORDER_STATUSES = ['settled', 'cancelled'];
const USER_ROLES = ['admin', 'worker', 'customer'];
const MUTABLE_ORDER_STATUSES = ['pending_assignment', 'in_progress', 'completed', 'cancelled'];
const RECHARGE_STATUSES = ['pending', 'approved', 'rejected'];
const PAYMENT_METHODS = ['alipay', 'wechat'];
const ROLE_LABEL_MAP = {
  admin: '管理员',
  worker: '打手',
  customer: '客户'
};

const ORDER_SELECT_SQL = `
  SELECT
    o.id,
    o.order_no,
    o.customer_id,
    o.worker_id,
    o.product_id,
    o.settlement_id,
    o.order_time,
    o.duration_hours,
    o.unit_price,
    o.total_amount,
    o.commission_amount,
    o.worker_income,
    o.status,
    o.remark,
    o.created_at,
    customer.display_name AS customer_name,
    worker.display_name AS worker_name,
    product.game_name,
    product.service_name,
    settlement.settlement_time
  FROM orders o
  JOIN users customer ON customer.id = o.customer_id
  LEFT JOIN users worker ON worker.id = o.worker_id
  JOIN service_products product ON product.id = o.product_id
  LEFT JOIN settlements settlement ON settlement.id = o.settlement_id
`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method.toUpperCase();

    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env)
      });
    }

    try {
      if (pathname === '/') {
        return ok(request, env, { name: 'game-service-platform-dashboard-worker', status: 'ok' });
      }

      if (pathname === '/api/login' && method === 'POST') {
        return handleLogin(request, env);
      }

      if (pathname === '/api/register' && method === 'POST') {
        return handleRegister(request, env);
      }

      if (pathname === '/api/logout' && method === 'POST') {
        const auth = await authenticate(request, env);
        if (auth.response) return auth.response;
        return handleLogout(request, env, auth.user);
      }

      if (pathname === '/api/me' && method === 'GET') {
        const auth = await authenticate(request, env);
        if (auth.response) return auth.response;
        return ok(request, env, auth.user);
      }

      if (pathname === '/api/admin/dashboard' && method === 'GET') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminDashboard(request, env);
      }

      if (pathname === '/api/admin/users' && method === 'GET') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminUsersList(request, env);
      }

      if (pathname === '/api/admin/users' && method === 'POST') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminCreateUser(request, env);
      }

      const adminUserMatch = pathname.match(/^\/api\/admin\/users\/(\d+)$/);
      if (adminUserMatch && method === 'DELETE') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminDeleteUser(request, env, Number(adminUserMatch[1]));
      }

      if (pathname === '/api/admin/workers' && method === 'GET') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminWorkersList(request, env);
      }

      if (pathname === '/api/admin/workers' && method === 'POST') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminCreateWorker(request, env);
      }

      const adminWorkerMatch = pathname.match(/^\/api\/admin\/workers\/(\d+)$/);
      if (adminWorkerMatch && method === 'DELETE') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminDeleteWorker(request, env, Number(adminWorkerMatch[1]));
      }

      if (pathname === '/api/admin/products' && method === 'GET') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminProductsList(request, env);
      }

      if (pathname === '/api/admin/products' && method === 'POST') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminCreateProduct(request, env);
      }

      const adminProductMatch = pathname.match(/^\/api\/admin\/products\/(\d+)$/);
      if (adminProductMatch && method === 'PUT') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminUpdateProduct(request, env, Number(adminProductMatch[1]));
      }

      if (adminProductMatch && method === 'DELETE') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminDeleteProduct(request, env, Number(adminProductMatch[1]));
      }

      if (pathname === '/api/admin/recharge-requests' && method === 'GET') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminRechargeRequestsList(request, env);
      }

      const adminRechargeReviewMatch = pathname.match(/^\/api\/admin\/recharge-requests\/(\d+)\/review$/);
      if (adminRechargeReviewMatch && method === 'PUT') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminReviewRecharge(request, env, auth.user, Number(adminRechargeReviewMatch[1]));
      }

      const adminRechargeMatch = pathname.match(/^\/api\/admin\/recharge-requests\/(\d+)$/);
      if (adminRechargeMatch && method === 'DELETE') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminDeleteRechargeRequest(request, env, Number(adminRechargeMatch[1]));
      }

      if (pathname === '/api/admin/orders' && method === 'GET') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminOrdersList(request, env);
      }

      if (pathname === '/api/admin/orders' && method === 'POST') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminCreateOrder(request, env);
      }

      const adminOrderMatch = pathname.match(/^\/api\/admin\/orders\/(\d+)$/);
      if (adminOrderMatch && method === 'GET') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminOrderDetail(request, env, Number(adminOrderMatch[1]));
      }

      if (adminOrderMatch && method === 'PUT') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminUpdateOrder(request, env, Number(adminOrderMatch[1]));
      }

      if (adminOrderMatch && method === 'DELETE') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminDeleteOrder(request, env, Number(adminOrderMatch[1]));
      }

      if (pathname === '/api/admin/settlements' && method === 'GET') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminSettlementsList(request, env);
      }

      if (pathname === '/api/admin/settlements' && method === 'POST') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminCreateSettlement(request, env);
      }

      const adminSettlementMatch = pathname.match(/^\/api\/admin\/settlements\/(\d+)$/);
      if (adminSettlementMatch && method === 'DELETE') {
        const auth = await authenticate(request, env, ['admin']);
        if (auth.response) return auth.response;
        return handleAdminDeleteSettlement(request, env, Number(adminSettlementMatch[1]));
      }

      if (pathname === '/api/worker/dashboard' && method === 'GET') {
        const auth = await authenticate(request, env, ['worker']);
        if (auth.response) return auth.response;
        return handleWorkerDashboard(request, env, auth.user);
      }

      if (pathname === '/api/worker/orders' && method === 'GET') {
        const auth = await authenticate(request, env, ['worker']);
        if (auth.response) return auth.response;
        return handleWorkerOrdersList(request, env, auth.user);
      }

      const workerOrderMatch = pathname.match(/^\/api\/worker\/orders\/(\d+)$/);
      if (workerOrderMatch && method === 'GET') {
        const auth = await authenticate(request, env, ['worker']);
        if (auth.response) return auth.response;
        return handleWorkerOrderDetail(request, env, auth.user, Number(workerOrderMatch[1]));
      }

      if (workerOrderMatch && method === 'DELETE') {
        const auth = await authenticate(request, env, ['worker']);
        if (auth.response) return auth.response;
        return handleWorkerDeleteOrder(request, env, auth.user, Number(workerOrderMatch[1]));
      }

      if (pathname === '/api/worker/settlements' && method === 'GET') {
        const auth = await authenticate(request, env, ['worker']);
        if (auth.response) return auth.response;
        return handleWorkerSettlementsList(request, env, auth.user);
      }

      const workerSettlementMatch = pathname.match(/^\/api\/worker\/settlements\/(\d+)$/);
      if (workerSettlementMatch && method === 'DELETE') {
        const auth = await authenticate(request, env, ['worker']);
        if (auth.response) return auth.response;
        return handleWorkerDeleteSettlement(request, env, auth.user, Number(workerSettlementMatch[1]));
      }

      if (pathname === '/api/customer/dashboard' && method === 'GET') {
        const auth = await authenticate(request, env, ['customer']);
        if (auth.response) return auth.response;
        return handleCustomerDashboard(request, env, auth.user);
      }

      if (pathname === '/api/customer/products' && method === 'GET') {
        const auth = await authenticate(request, env, ['customer']);
        if (auth.response) return auth.response;
        return handleCustomerProductsList(request, env);
      }

      if (pathname === '/api/customer/recharge-requests' && method === 'POST') {
        const auth = await authenticate(request, env, ['customer']);
        if (auth.response) return auth.response;
        return handleCustomerCreateRechargeRequest(request, env, auth.user);
      }

      if (pathname === '/api/customer/recharge-requests' && method === 'GET') {
        const auth = await authenticate(request, env, ['customer']);
        if (auth.response) return auth.response;
        return handleCustomerRechargeRequestsList(request, env, auth.user);
      }

      const customerRechargeMatch = pathname.match(/^\/api\/customer\/recharge-requests\/(\d+)$/);
      if (customerRechargeMatch && method === 'DELETE') {
        const auth = await authenticate(request, env, ['customer']);
        if (auth.response) return auth.response;
        return handleCustomerDeleteRechargeRequest(request, env, auth.user, Number(customerRechargeMatch[1]));
      }

      if (pathname === '/api/customer/orders' && method === 'POST') {
        const auth = await authenticate(request, env, ['customer']);
        if (auth.response) return auth.response;
        return handleCustomerCreateOrder(request, env, auth.user);
      }

      if (pathname === '/api/customer/orders' && method === 'GET') {
        const auth = await authenticate(request, env, ['customer']);
        if (auth.response) return auth.response;
        return handleCustomerOrdersList(request, env, auth.user);
      }

      const customerOrderMatch = pathname.match(/^\/api\/customer\/orders\/(\d+)$/);
      if (customerOrderMatch && method === 'GET') {
        const auth = await authenticate(request, env, ['customer']);
        if (auth.response) return auth.response;
        return handleCustomerOrderDetail(request, env, auth.user, Number(customerOrderMatch[1]));
      }

      if (customerOrderMatch && method === 'DELETE') {
        const auth = await authenticate(request, env, ['customer']);
        if (auth.response) return auth.response;
        return handleCustomerDeleteOrder(request, env, auth.user, Number(customerOrderMatch[1]));
      }

      return fail(request, env, 404, '接口不存在。', 'NOT_FOUND');
    } catch (error) {
      console.error(error);
      return fail(request, env, 500, '服务器内部错误。', 'INTERNAL_SERVER_ERROR', String(error));
    }
  }
};

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigin = env.FRONTEND_ORIGIN || origin || '*';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Expose-Headers': 'Content-Length',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

function ok(request, env, data, status = 200, message = 'ok') {
  return new Response(
    JSON.stringify({
      success: true,
      message,
      data
    }),
    {
      status,
      headers: corsHeaders(request, env)
    }
  );
}

function fail(request, env, status, message, code = 'BAD_REQUEST', details) {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code,
        message,
        details
      }
    }),
    {
      status,
      headers: corsHeaders(request, env)
    }
  );
}

async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function trimString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function optionalString(value) {
  const text = trimString(value);
  return text ? text : null;
}

function positiveNumber(value) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function optionalId(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function booleanFlag(value, defaultValue = false) {
  if (typeof value === 'boolean') return value;
  if (value === '1' || value === 1 || value === 'true') return true;
  if (value === '0' || value === 0 || value === 'false') return false;
  return defaultValue;
}

function roundMoney(value) {
  return Number(Number(value).toFixed(2));
}

function generateOrderNo() {
  const now = new Date();
  const parts = [
    now.getUTCFullYear().toString(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
    String(now.getUTCHours()).padStart(2, '0'),
    String(now.getUTCMinutes()).padStart(2, '0'),
    String(now.getUTCSeconds()).padStart(2, '0'),
    String(now.getUTCMilliseconds()).padStart(3, '0')
  ];
  const randomSuffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `GSP${parts.join('')}${randomSuffix}`;
}

function isOrderNoConflict(error) {
  const message = String(error || '').toLowerCase();
  return message.includes('orders.order_no') || (message.includes('unique') && message.includes('order_no'));
}

async function insertOrderWithRetry(
  db,
  {
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
  }
) {
  let lastError;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNo = generateOrderNo();

    try {
      const result = await execute(
        db,
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

      return {
        orderId: Number(result.meta.last_row_id),
        orderNo
      };
    } catch (error) {
      lastError = error;
      if (!isOrderNoConflict(error) || attempt === 4) {
        throw error;
      }
    }
  }

  throw lastError || new Error('ORDER_CREATE_FAILED');
}

async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, '0')).join('');
}

function bytesToBase64Url(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function stringToBase64Url(text) {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

function base64UrlToBytes(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlToString(value) {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

async function signHs256(input, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function createToken(user, secret) {
  const header = stringToBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = stringToBase64Url(
    JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      sessionKey: user.sessionKey || '',
      iat: now,
      exp: now + 7 * 24 * 60 * 60
    })
  );
  const unsigned = `${header}.${payload}`;
  const signature = await signHs256(unsigned, secret);
  return `${unsigned}.${signature}`;
}

async function verifyToken(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('TOKEN_FORMAT_INVALID');
  }
  const [header, payload, signature] = parts;
  const expected = await signHs256(`${header}.${payload}`, secret);
  if (expected !== signature) {
    throw new Error('TOKEN_SIGNATURE_INVALID');
  }
  const parsedPayload = JSON.parse(base64UrlToString(payload));
  const now = Math.floor(Date.now() / 1000);
  if (!parsedPayload.exp || parsedPayload.exp < now) {
    throw new Error('TOKEN_EXPIRED');
  }
  return parsedPayload;
}

async function authenticate(request, env, roles) {
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) {
    return {
      response: fail(request, env, 401, '缺少有效的认证令牌。', 'UNAUTHORIZED')
    };
  }

  const token = authorization.slice(7).trim();
  if (!token) {
    return {
      response: fail(request, env, 401, '缺少有效的认证令牌。', 'UNAUTHORIZED')
    };
  }

  let payload;
  try {
    payload = await verifyToken(token, env.JWT_SECRET);
  } catch {
    return {
      response: fail(request, env, 401, '登录态已失效，请重新登录。', 'TOKEN_INVALID')
    };
  }

  const dbUser = await getUserById(env.DB, Number(payload.id));
  if (!dbUser || !dbUser.is_active) {
    return {
      response: fail(request, env, 401, '账号已被停用或删除，请重新登录。', 'ACCOUNT_DISABLED')
    };
  }

  if (!payload.sessionKey || payload.sessionKey !== (dbUser.session_key || '')) {
    return {
      response: fail(request, env, 401, '该账号已在其他设备重新登录，请重新登录。', 'SESSION_REPLACED')
    };
  }

  const user = {
    id: Number(dbUser.id),
    username: dbUser.username,
    role: dbUser.role,
    displayName: dbUser.display_name
  };

  if (roles && !roles.includes(user.role)) {
    return {
      response: fail(request, env, 403, '当前账号无权访问该资源。', 'FORBIDDEN')
    };
  }

  return { user };
}

async function queryAll(db, sql, params = []) {
  const result = await db.prepare(sql).bind(...params).all();
  return result.results || [];
}

async function queryFirst(db, sql, params = []) {
  const result = await db.prepare(sql).bind(...params).first();
  return result || null;
}

async function execute(db, sql, params = []) {
  return db.prepare(sql).bind(...params).run();
}

async function getUserByUsername(db, username) {
  return queryFirst(
    db,
    `
      SELECT id, username, password_hash, role, display_name, is_active, session_key, created_at
      FROM users
      WHERE username = ?
    `,
    [username]
  );
}

async function getUserById(db, userId) {
  return queryFirst(
    db,
    `
      SELECT id, username, password_hash, role, display_name, is_active, session_key, created_at
      FROM users
      WHERE id = ?
    `,
    [userId]
  );
}

async function rotateUserSessionKey(db, userId) {
  const sessionKey = crypto.randomUUID();
  await execute(db, `UPDATE users SET session_key = ? WHERE id = ?`, [sessionKey, userId]);
  return sessionKey;
}

async function getProductById(db, productId) {
  return queryFirst(
    db,
    `
      SELECT id, game_name, service_name, unit_price, commission_rate, description, is_active, created_at
      FROM service_products
      WHERE id = ?
    `,
    [productId]
  );
}

async function getWalletBalance(db, userId) {
  const row = await queryFirst(
    db,
    `
      SELECT
        COALESCE(
          SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END),
          0
        ) AS balance
      FROM wallet_transactions
      WHERE user_id = ?
    `,
    [userId]
  );
  return roundMoney(Number(row?.balance || 0));
}

async function getOrderDetailById(db, orderId) {
  return queryFirst(db, `${ORDER_SELECT_SQL} WHERE o.id = ? AND o.is_deleted = 0`, [orderId]);
}

async function getOrderDetailForWorker(db, orderId, workerId) {
  return queryFirst(
    db,
    `${ORDER_SELECT_SQL} WHERE o.id = ? AND o.worker_id = ? AND o.is_deleted = 0`,
    [orderId, workerId]
  );
}

async function getOrderDetailForCustomer(db, orderId, customerId) {
  return queryFirst(
    db,
    `${ORDER_SELECT_SQL} WHERE o.id = ? AND o.customer_id = ? AND o.is_deleted = 0`,
    [orderId, customerId]
  );
}

async function getOrderRecordById(db, orderId) {
  return queryFirst(
    db,
    `
      SELECT id, order_no, customer_id, worker_id, status, settlement_id, is_deleted
      FROM orders
      WHERE id = ?
    `,
    [orderId]
  );
}

async function getOrderRecordForWorker(db, orderId, workerId) {
  return queryFirst(
    db,
    `
      SELECT id, order_no, customer_id, worker_id, status, settlement_id, is_deleted
      FROM orders
      WHERE id = ? AND worker_id = ?
    `,
    [orderId, workerId]
  );
}

async function getOrderRecordForCustomer(db, orderId, customerId) {
  return queryFirst(
    db,
    `
      SELECT id, order_no, customer_id, worker_id, status, settlement_id, is_deleted
      FROM orders
      WHERE id = ? AND customer_id = ?
    `,
    [orderId, customerId]
  );
}

function canDeleteOrderStatus(status) {
  return DELETABLE_ORDER_STATUSES.includes(status);
}

async function softDeleteOrder(request, env, order) {
  if (!order || Number(order.is_deleted) === 1) {
    return fail(request, env, 404, '订单不存在。', 'NOT_FOUND');
  }

  if (!canDeleteOrderStatus(order.status)) {
    return fail(
      request,
      env,
      409,
      '只有已结算或已取消的订单记录才允许删除。',
      'ORDER_DELETE_BLOCKED'
    );
  }

  await execute(env.DB, `UPDATE orders SET is_deleted = 1 WHERE id = ?`, [order.id]);
  return ok(request, env, { id: order.id, deleted: true }, 200, '订单已删除。');
}

function normalizeOrderRow(row) {
  return {
    ...row,
    duration_hours: Number(row.duration_hours),
    unit_price: roundMoney(Number(row.unit_price)),
    total_amount: roundMoney(Number(row.total_amount)),
    commission_amount: roundMoney(Number(row.commission_amount)),
    worker_income: roundMoney(Number(row.worker_income))
  };
}

function normalizeRechargeRow(row) {
  return {
    ...row,
    amount: roundMoney(Number(row.amount))
  };
}

function normalizeSettlementRow(row) {
  return {
    ...row,
    amount: roundMoney(Number(row.amount))
  };
}

async function deleteRechargeRequestWithRollback(request, env, rechargeRequestId, expectedUserId = null) {
  const params = expectedUserId === null ? [rechargeRequestId] : [rechargeRequestId, expectedUserId];
  const rechargeRequest = await queryFirst(
    env.DB,
    `
      SELECT id, user_id, amount, status
      FROM recharge_requests
      WHERE id = ? ${expectedUserId === null ? '' : 'AND user_id = ?'}
    `,
    params
  );

  if (!rechargeRequest) {
    return fail(request, env, 404, '充值记录不存在。', 'NOT_FOUND');
  }

  if (rechargeRequest.status === 'approved') {
    const balance = await getWalletBalance(env.DB, rechargeRequest.user_id);
    const amount = roundMoney(Number(rechargeRequest.amount));
    if (balance < amount) {
      return fail(
        request,
        env,
        409,
        '该笔已入账充值已经被部分使用，当前余额不足以回滚，不能删除。',
        'RECHARGE_DELETE_BLOCKED'
      );
    }

    await execute(env.DB, `DELETE FROM wallet_transactions WHERE related_recharge_request_id = ?`, [rechargeRequestId]);
  }

  await execute(env.DB, `DELETE FROM recharge_requests WHERE id = ?`, [rechargeRequestId]);
  return ok(request, env, { id: rechargeRequestId, deleted: true }, 200, '充值记录已删除。');
}

async function handleLogin(request, env) {
  const body = await parseJson(request);
  const username = trimString(body.username);
  const password = trimString(body.password);
  const role = trimString(body.role);

  if (!USER_ROLES.includes(role)) {
    return fail(request, env, 400, '请选择正确的角色登录入口。');
  }

  if (!username || !password) {
    return fail(request, env, 400, '请输入账号和密码。');
  }

  const user = await getUserByUsername(env.DB, username);
  if (!user || !user.is_active) {
    return fail(request, env, 401, '账号或密码错误。', 'LOGIN_FAILED');
  }

  const passwordHash = await sha256Hex(password);
  if (passwordHash !== user.password_hash) {
    return fail(request, env, 401, '账号或密码错误。', 'LOGIN_FAILED');
  }

  if (user.role !== role) {
    return fail(
      request,
      env,
      403,
      `该账号属于${ROLE_LABEL_MAP[user.role] || '其他角色'}，请使用对应入口登录。`,
      'ROLE_LOGIN_MISMATCH'
    );
  }

  const authUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.display_name
  };
  const sessionKey = await rotateUserSessionKey(env.DB, authUser.id);
  const token = await createToken({ ...authUser, sessionKey }, env.JWT_SECRET);

  return ok(request, env, { token, user: authUser });
}

async function handleRegister(request, env) {
  const body = await parseJson(request);
  const username = trimString(body.username);
  const password = trimString(body.password);
  const displayName = trimString(body.display_name);

  if (!username || !password || !displayName) {
    return fail(request, env, 400, '用户名、密码和显示名称均不能为空。');
  }

  if (!/^[a-zA-Z0-9_]{4,24}$/.test(username)) {
    return fail(request, env, 400, '用户名需为 4 到 24 位字母、数字或下划线。');
  }

  if (password.length < 6 || password.length > 64) {
    return fail(request, env, 400, '密码长度需在 6 到 64 位之间。');
  }

  if (displayName.length < 2 || displayName.length > 24) {
    return fail(request, env, 400, '显示名称长度需在 2 到 24 位之间。');
  }

  const existingUser = await getUserByUsername(env.DB, username);
  if (existingUser) {
    return fail(request, env, 409, '用户名已存在，请更换后重试。', 'USERNAME_EXISTS');
  }

  const passwordHash = await sha256Hex(password);

  try {
    const result = await execute(
      env.DB,
      `
        INSERT INTO users (username, password_hash, role, display_name)
        VALUES (?, ?, 'customer', ?)
      `,
      [username, passwordHash, displayName]
    );

    const authUser = {
      id: Number(result.meta.last_row_id),
      username,
      role: 'customer',
      displayName
    };
    const sessionKey = await rotateUserSessionKey(env.DB, authUser.id);
    const token = await createToken({ ...authUser, sessionKey }, env.JWT_SECRET);

    return ok(request, env, { token, user: authUser }, 201, '注册成功。');
  } catch (error) {
    return fail(request, env, 500, '注册失败，请稍后重试。', 'REGISTER_FAILED', String(error));
  }
}

async function handleLogout(request, env, authUser) {
  await rotateUserSessionKey(env.DB, authUser.id);
  return ok(request, env, { loggedOut: true }, 200, '已退出登录。');
}

async function handleAdminDashboard(request, env) {
  const platformBalanceRow = await queryFirst(
    env.DB,
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
  const cumulativeRechargeRow = await queryFirst(
    env.DB,
    `SELECT COALESCE(SUM(amount), 0) AS total FROM recharge_requests WHERE status = 'approved'`
  );
  const userCountRow = await queryFirst(env.DB, `SELECT COUNT(*) AS total FROM users WHERE role = 'customer'`);
  const workerCountRow = await queryFirst(env.DB, `SELECT COUNT(*) AS total FROM users WHERE role = 'worker'`);
  const orderCountRow = await queryFirst(env.DB, `SELECT COUNT(*) AS total FROM orders WHERE is_deleted = 0`);
  const settledAmountRow = await queryFirst(env.DB, `SELECT COALESCE(SUM(amount), 0) AS total FROM settlements`);
  const unsettledAmountRow = await queryFirst(
    env.DB,
    `
      SELECT COALESCE(SUM(worker_income), 0) AS total
      FROM orders
      WHERE worker_id IS NOT NULL
        AND is_deleted = 0
        AND status NOT IN ('settled', 'cancelled')
    `
  );

  return ok(request, env, {
    platformBalance: roundMoney(Number(platformBalanceRow?.total || 0)),
    cumulativeRecharge: roundMoney(Number(cumulativeRechargeRow?.total || 0)),
    userCount: Number(userCountRow?.total || 0),
    workerCount: Number(workerCountRow?.total || 0),
    orderCount: Number(orderCountRow?.total || 0),
    settledAmount: roundMoney(Number(settledAmountRow?.total || 0)),
    unsettledAmount: roundMoney(Number(unsettledAmountRow?.total || 0))
  });
}

async function handleAdminUsersList(request, env) {
  const rows = await queryAll(
    env.DB,
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
          WHERE o.customer_id = u.id AND o.is_deleted = 0
        ), 0) AS order_count
      FROM users u
      WHERE u.role = 'customer'
        AND u.is_active = 1
      ORDER BY u.created_at DESC
    `
  );

  return ok(
    request,
    env,
    rows.map((row) => ({
      ...row,
      balance: roundMoney(Number(row.balance)),
      total_recharged: roundMoney(Number(row.total_recharged))
    }))
  );
}

async function handleAdminCreateUser(request, env) {
  const body = await parseJson(request);
  const username = trimString(body.username);
  const password = trimString(body.password);
  const displayName = trimString(body.display_name);

  if (!username || !password || !displayName) {
    return fail(request, env, 400, '用户名、密码和显示名称均不能为空。');
  }

  const passwordHash = await sha256Hex(password);
  try {
    const result = await execute(
      env.DB,
      `
        INSERT INTO users (username, password_hash, role, display_name)
        VALUES (?, ?, 'customer', ?)
      `,
      [username, passwordHash, displayName]
    );
    return ok(request, env, { id: Number(result.meta.last_row_id) }, 201, '用户创建成功。');
  } catch (error) {
    return fail(request, env, 409, '用户名已存在或数据无效。', 'USER_CREATE_FAILED', String(error));
  }
}

async function handleAdminDeleteUser(request, env, userId) {
  const user = await getUserById(env.DB, userId);
  if (!user || user.role !== 'customer' || !user.is_active) {
    return fail(request, env, 404, '用户不存在。', 'USER_NOT_FOUND');
  }

  const balance = await getWalletBalance(env.DB, userId);
  if (balance !== 0) {
    return fail(request, env, 409, '该用户仍有余额，请先处理余额后再删除。', 'USER_DELETE_BLOCKED');
  }

  const pendingRechargeRow = await queryFirst(
    env.DB,
    `SELECT COUNT(*) AS total FROM recharge_requests WHERE user_id = ? AND status = 'pending'`,
    [userId]
  );
  if (Number(pendingRechargeRow?.total || 0) > 0) {
    return fail(request, env, 409, '该用户仍有待审核充值申请，暂不能删除。', 'USER_DELETE_BLOCKED');
  }

  const activeOrderRow = await queryFirst(
    env.DB,
    `
      SELECT COUNT(*) AS total
      FROM orders
      WHERE customer_id = ?
        AND status IN ('pending_recharge', 'pending_assignment', 'in_progress')
    `,
    [userId]
  );
  if (Number(activeOrderRow?.total || 0) > 0) {
    return fail(request, env, 409, '该用户仍有进行中的订单，暂不能删除。', 'USER_DELETE_BLOCKED');
  }

  const archivedUsername = `deleted_customer_${userId}_${Date.now()}`;
  await execute(env.DB, `UPDATE users SET is_active = 0, username = ? WHERE id = ?`, [archivedUsername, userId]);
  return ok(request, env, { id: userId, deleted: true }, 200, '用户已删除。');
}

async function handleAdminWorkersList(request, env) {
  const rows = await queryAll(
    env.DB,
    `
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.created_at,
        COALESCE((SELECT COUNT(*) FROM orders o WHERE o.worker_id = u.id AND o.is_deleted = 0), 0) AS order_count,
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
        AND u.is_active = 1
      ORDER BY u.created_at DESC
    `
  );

  return ok(
    request,
    env,
    rows.map((row) => {
      const totalIncome = roundMoney(Number(row.total_income));
      const settledAmount = roundMoney(Number(row.settled_amount));
      return {
        ...row,
        total_income: totalIncome,
        settled_amount: settledAmount,
        unsettled_amount: roundMoney(totalIncome - settledAmount)
      };
    })
  );
}

async function handleAdminCreateWorker(request, env) {
  const body = await parseJson(request);
  const username = trimString(body.username);
  const password = trimString(body.password);
  const displayName = trimString(body.display_name);

  if (!username || !password || !displayName) {
    return fail(request, env, 400, '用户名、密码和显示名称均不能为空。');
  }

  const passwordHash = await sha256Hex(password);
  try {
    const result = await execute(
      env.DB,
      `
        INSERT INTO users (username, password_hash, role, display_name)
        VALUES (?, ?, 'worker', ?)
      `,
      [username, passwordHash, displayName]
    );
    return ok(request, env, { id: Number(result.meta.last_row_id) }, 201, '打手创建成功。');
  } catch (error) {
    return fail(request, env, 409, '用户名已存在或数据无效。', 'WORKER_CREATE_FAILED', String(error));
  }
}

async function handleAdminDeleteWorker(request, env, workerId) {
  const worker = await getUserById(env.DB, workerId);
  if (!worker || worker.role !== 'worker' || !worker.is_active) {
    return fail(request, env, 404, '打手不存在。', 'WORKER_NOT_FOUND');
  }

  const activeOrderRow = await queryFirst(
    env.DB,
    `
      SELECT COUNT(*) AS total
      FROM orders
      WHERE worker_id = ?
        AND status NOT IN ('settled', 'cancelled')
    `,
    [workerId]
  );
  if (Number(activeOrderRow?.total || 0) > 0) {
    return fail(request, env, 409, '该打手仍有关联中的订单或待结算订单，暂不能删除。', 'WORKER_DELETE_BLOCKED');
  }

  const archivedUsername = `deleted_worker_${workerId}_${Date.now()}`;
  await execute(env.DB, `UPDATE users SET is_active = 0, username = ? WHERE id = ?`, [archivedUsername, workerId]);
  return ok(request, env, { id: workerId, deleted: true }, 200, '打手已删除。');
}

async function handleAdminProductsList(request, env) {
  const rows = await queryAll(
    env.DB,
    `
      SELECT id, game_name, service_name, unit_price, commission_rate, description, is_active, created_at
      FROM service_products
      ORDER BY is_active DESC, created_at DESC
    `
  );

  return ok(
    request,
    env,
    rows.map((row) => ({
      ...row,
      unit_price: roundMoney(Number(row.unit_price)),
      commission_rate: Number(row.commission_rate),
      is_active: Boolean(row.is_active)
    }))
  );
}

async function handleAdminCreateProduct(request, env) {
  const body = await parseJson(request);
  const gameName = trimString(body.game_name);
  const serviceName = trimString(body.service_name);
  const unitPrice = positiveNumber(body.unit_price);
  const commissionRate = body.commission_rate === undefined ? 0.2 : Number(body.commission_rate);
  const description = optionalString(body.description);
  const isActive = booleanFlag(body.is_active, true);

  if (!gameName || !serviceName || unitPrice === null) {
    return fail(request, env, 400, '游戏名称、服务名称和单价不能为空。');
  }
  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate >= 1) {
    return fail(request, env, 400, '抽成比例必须在 0 到 1 之间。');
  }

  const result = await execute(
    env.DB,
    `
      INSERT INTO service_products (game_name, service_name, unit_price, commission_rate, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [gameName, serviceName, roundMoney(unitPrice), commissionRate, description, isActive ? 1 : 0]
  );

  return ok(request, env, { id: Number(result.meta.last_row_id) }, 201, '服务项目创建成功。');
}

async function handleAdminUpdateProduct(request, env, productId) {
  const existing = await getProductById(env.DB, productId);
  if (!existing) {
    return fail(request, env, 404, '服务项目不存在。', 'NOT_FOUND');
  }

  const body = await parseJson(request);
  const gameName = trimString(body.game_name) || existing.game_name;
  const serviceName = trimString(body.service_name) || existing.service_name;
  const unitPrice = positiveNumber(body.unit_price) ?? Number(existing.unit_price);
  const description =
    body.description === undefined ? existing.description : optionalString(body.description);
  const commissionRate =
    body.commission_rate === undefined ? Number(existing.commission_rate) : Number(body.commission_rate);
  const isActive =
    body.is_active === undefined ? Boolean(existing.is_active) : booleanFlag(body.is_active);

  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate >= 1) {
    return fail(request, env, 400, '抽成比例必须在 0 到 1 之间。');
  }

  await execute(
    env.DB,
    `
      UPDATE service_products
      SET game_name = ?, service_name = ?, unit_price = ?, commission_rate = ?, description = ?, is_active = ?
      WHERE id = ?
    `,
    [gameName, serviceName, roundMoney(unitPrice), commissionRate, description, isActive ? 1 : 0, productId]
  );

  return ok(request, env, { id: productId }, 200, '服务项目更新成功。');
}

async function handleAdminDeleteProduct(request, env, productId) {
  const existing = await getProductById(env.DB, productId);
  if (!existing) {
    return fail(request, env, 404, '服务项目不存在。', 'NOT_FOUND');
  }

  const relatedOrdersRow = await queryFirst(
    env.DB,
    `SELECT COUNT(*) AS total FROM orders WHERE product_id = ?`,
    [productId]
  );

  if (Number(relatedOrdersRow?.total || 0) > 0) {
    return fail(
      request,
      env,
      409,
      '该服务项目已有关联订单，不能直接删除，请改为停用。',
      'PRODUCT_DELETE_BLOCKED'
    );
  }

  await execute(env.DB, `DELETE FROM service_products WHERE id = ?`, [productId]);
  return ok(request, env, { id: productId, deleted: true }, 200, '服务项目已删除。');
}

async function handleAdminRechargeRequestsList(request, env) {
  const rows = await queryAll(
    env.DB,
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
  return ok(request, env, rows.map(normalizeRechargeRow));
}

async function handleAdminReviewRecharge(request, env, authUser, rechargeRequestId) {
  const body = await parseJson(request);
  const status = body.status;
  const reviewRemark = optionalString(body.review_remark);

  if (status !== 'approved' && status !== 'rejected') {
    return fail(request, env, 400, '审核状态只能是 approved 或 rejected。');
  }

  const rechargeRequest = await queryFirst(
    env.DB,
    `
      SELECT id, user_id, amount, status
      FROM recharge_requests
      WHERE id = ?
    `,
    [rechargeRequestId]
  );

  if (!rechargeRequest) {
    return fail(request, env, 404, '充值申请不存在。', 'NOT_FOUND');
  }
  if (rechargeRequest.status !== 'pending') {
    return fail(request, env, 400, '该充值申请已经处理过了。');
  }

  const reviewedAt = new Date().toISOString();
  await execute(
    env.DB,
    `
      UPDATE recharge_requests
      SET status = ?, review_remark = ?, reviewed_by = ?, reviewed_at = ?
      WHERE id = ?
    `,
    [status, reviewRemark, authUser.id, reviewedAt, rechargeRequestId]
  );

  if (status === 'approved') {
    await execute(
      env.DB,
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
      [rechargeRequest.user_id, roundMoney(Number(rechargeRequest.amount)), rechargeRequestId, '充值审核通过，自动入账。']
    );
  }

  return ok(request, env, { id: rechargeRequestId, status }, 200, '审核完成。');
}

async function handleAdminDeleteRechargeRequest(request, env, rechargeRequestId) {
  return deleteRechargeRequestWithRollback(request, env, rechargeRequestId);
}

async function handleAdminOrdersList(request, env) {
  const rows = await queryAll(env.DB, `${ORDER_SELECT_SQL} WHERE o.is_deleted = 0 ORDER BY o.created_at DESC`);
  return ok(request, env, rows.map(normalizeOrderRow));
}

async function handleAdminOrderDetail(request, env, orderId) {
  const order = await getOrderDetailById(env.DB, orderId);
  if (!order) {
    return fail(request, env, 404, '订单不存在。', 'NOT_FOUND');
  }
  return ok(request, env, normalizeOrderRow(order));
}

async function handleAdminDeleteOrder(request, env, orderId) {
  const order = await getOrderRecordById(env.DB, orderId);
  return softDeleteOrder(request, env, order);
}

async function handleAdminCreateOrder(request, env) {
  const body = await parseJson(request);
  const customerId = optionalId(body.customer_id);
  const workerId = optionalId(body.worker_id);
  const productId = optionalId(body.product_id);
  const durationHours = positiveNumber(body.duration_hours);
  const orderTime = trimString(body.order_time) || new Date().toISOString();
  const remark = optionalString(body.remark);
  const providedStatus = body.status;
  const providedCommissionAmount =
    body.commission_amount === undefined ? null : Number(body.commission_amount);

  if (!customerId || !productId || durationHours === null) {
    return fail(request, env, 400, 'customer_id、product_id 和 duration_hours 必填。');
  }
  if (providedCommissionAmount !== null && (!Number.isFinite(providedCommissionAmount) || providedCommissionAmount < 0)) {
    return fail(request, env, 400, 'commission_amount 不能小于 0。');
  }
  if (providedStatus !== undefined && !MUTABLE_ORDER_STATUSES.includes(providedStatus)) {
    return fail(request, env, 400, '订单状态非法。');
  }

  const customer = await getUserById(env.DB, customerId);
  const product = await getProductById(env.DB, productId);

  if (!customer || customer.role !== 'customer') {
    return fail(request, env, 400, '客户不存在。');
  }
  if (!product) {
    return fail(request, env, 400, '服务项目不存在。');
  }

  if (workerId) {
    const worker = await getUserById(env.DB, workerId);
    if (!worker || worker.role !== 'worker') {
      return fail(request, env, 400, '打手不存在。');
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
    return fail(request, env, 400, '抽成金额不能大于订单总额。');
  }

  const walletBalance = await getWalletBalance(env.DB, customerId);
  if (walletBalance < totalAmount) {
    return fail(request, env, 400, '客户余额不足，无法创建订单。');
  }

  const status = providedStatus ?? (workerId ? 'in_progress' : 'pending_assignment');
  if (status !== 'pending_assignment' && status !== 'cancelled' && !workerId) {
    return fail(request, env, 400, '进行中或已完成订单必须指定打手。');
  }

  const { orderId, orderNo } = await insertOrderWithRetry(env.DB, {
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
  });

  await execute(
    env.DB,
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

  const order = await getOrderDetailById(env.DB, orderId);
  return ok(request, env, normalizeOrderRow(order), 201, '订单创建成功。');
}

async function handleAdminUpdateOrder(request, env, orderId) {
  const existing = await getOrderDetailById(env.DB, orderId);
  if (!existing) {
    return fail(request, env, 404, '订单不存在。', 'NOT_FOUND');
  }
  if (existing.status === 'settled') {
    return fail(request, env, 400, '已结算订单不允许修改。');
  }

  const body = await parseJson(request);
  const nextStatus = body.status === undefined ? existing.status : body.status;
  const nextWorkerId = body.worker_id === undefined ? existing.worker_id : optionalId(body.worker_id);
  const nextRemark = body.remark === undefined ? existing.remark : optionalString(body.remark);
  const nextOrderTime = trimString(body.order_time) || existing.order_time;

  if (existing.status === 'cancelled' && nextStatus !== 'cancelled') {
    return fail(request, env, 400, '已取消订单不支持重新激活。');
  }
  if (!MUTABLE_ORDER_STATUSES.includes(nextStatus)) {
    return fail(request, env, 400, '订单状态非法。');
  }
  if (nextStatus === 'settled') {
    return fail(request, env, 400, '请通过结算接口完成 settled 状态更新。');
  }
  if (nextStatus !== 'pending_assignment' && nextStatus !== 'cancelled' && !nextWorkerId) {
    return fail(request, env, 400, '进行中或已完成订单必须指定打手。');
  }

  if (nextWorkerId) {
    const worker = await getUserById(env.DB, nextWorkerId);
    if (!worker || worker.role !== 'worker') {
      return fail(request, env, 400, '打手不存在。');
    }
  }

  let productId = existing.product_id;
  if (body.product_id !== undefined) {
    const requestedProductId = optionalId(body.product_id);
    if (!requestedProductId) {
      return fail(request, env, 400, 'product_id 无效。');
    }
    productId = requestedProductId;
  }

  const product = await getProductById(env.DB, productId);
  if (!product) {
    return fail(request, env, 400, '服务项目不存在。');
  }

  let durationHours = Number(existing.duration_hours);
  if (body.duration_hours !== undefined) {
    const parsedDuration = positiveNumber(body.duration_hours);
    if (parsedDuration === null) {
      return fail(request, env, 400, 'duration_hours 必须大于 0。');
    }
    durationHours = parsedDuration;
  }

  let unitPrice = Number(existing.unit_price);
  if (body.unit_price !== undefined) {
    const parsedUnitPrice = positiveNumber(body.unit_price);
    if (parsedUnitPrice === null) {
      return fail(request, env, 400, 'unit_price 必须大于 0。');
    }
    unitPrice = parsedUnitPrice;
  } else if (body.product_id !== undefined) {
    unitPrice = Number(product.unit_price);
  }

  const totalAmount = roundMoney(durationHours * unitPrice);
  let commissionAmount;
  if (body.commission_amount !== undefined) {
    const parsedCommissionAmount = Number(body.commission_amount);
    if (!Number.isFinite(parsedCommissionAmount) || parsedCommissionAmount < 0) {
      return fail(request, env, 400, 'commission_amount 不能小于 0。');
    }
    commissionAmount = roundMoney(parsedCommissionAmount);
  } else {
    commissionAmount = roundMoney(totalAmount * Number(product.commission_rate));
  }

  const workerIncome = roundMoney(totalAmount - commissionAmount);
  if (workerIncome < 0) {
    return fail(request, env, 400, '抽成金额不能大于订单总额。');
  }

  if (nextStatus === 'cancelled') {
    const refunded = await queryFirst(
      env.DB,
      `
        SELECT COUNT(*) AS total
        FROM wallet_transactions
        WHERE related_order_id = ? AND type = 'refund'
      `,
      [orderId]
    );
    if (Number(refunded?.total || 0) === 0) {
      await execute(
        env.DB,
        `
          INSERT INTO wallet_transactions (user_id, type, amount, direction, related_order_id, remark)
          VALUES (?, 'refund', ?, 'in', ?, ?)
        `,
        [
          existing.customer_id,
          roundMoney(Number(existing.total_amount)),
          orderId,
          `订单 ${existing.order_no} 取消退款。`
        ]
      );
    }
  } else {
    const delta = roundMoney(totalAmount - Number(existing.total_amount));
    if (delta > 0) {
      const walletBalance = await getWalletBalance(env.DB, existing.customer_id);
      if (walletBalance < delta) {
        return fail(request, env, 400, '客户余额不足，无法完成订单调价。');
      }
      await execute(
        env.DB,
        `
          INSERT INTO wallet_transactions (user_id, type, amount, direction, related_order_id, remark)
          VALUES (?, 'adjust', ?, 'out', ?, ?)
        `,
        [existing.customer_id, delta, orderId, `订单 ${existing.order_no} 调整补扣。`]
      );
    } else if (delta < 0) {
      await execute(
        env.DB,
        `
          INSERT INTO wallet_transactions (user_id, type, amount, direction, related_order_id, remark)
          VALUES (?, 'refund', ?, 'in', ?, ?)
        `,
        [existing.customer_id, Math.abs(delta), orderId, `订单 ${existing.order_no} 调整退款。`]
      );
    }
  }

  await execute(
    env.DB,
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
      commissionAmount,
      workerIncome,
      nextStatus,
      nextRemark,
      orderId
    ]
  );

  const order = await getOrderDetailById(env.DB, orderId);
  return ok(request, env, normalizeOrderRow(order), 200, '订单更新成功。');
}

async function handleAdminSettlementsList(request, env) {
  const rows = await queryAll(
    env.DB,
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
  return ok(request, env, rows.map(normalizeSettlementRow));
}

async function handleAdminCreateSettlement(request, env) {
  const body = await parseJson(request);
  const workerId = optionalId(body.worker_id);
  const remark = optionalString(body.remark);

  if (!workerId) {
    return fail(request, env, 400, 'worker_id 必填。');
  }

  const worker = await getUserById(env.DB, workerId);
  if (!worker || worker.role !== 'worker') {
    return fail(request, env, 400, '打手不存在。');
  }

  const pendingOrders = await queryAll(
    env.DB,
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
    return fail(request, env, 400, '当前没有可结算的已完成订单。');
  }

  const totalAmount = roundMoney(
    pendingOrders.reduce((sum, order) => sum + Number(order.worker_income), 0)
  );
  const settlementTime = new Date().toISOString();
  const result = await execute(
    env.DB,
    `
      INSERT INTO settlements (worker_id, amount, settlement_time, remark)
      VALUES (?, ?, ?, ?)
    `,
    [workerId, totalAmount, settlementTime, remark]
  );

  const settlementId = Number(result.meta.last_row_id);
  for (const order of pendingOrders) {
    await execute(
      env.DB,
      `
        UPDATE orders
        SET status = 'settled', settlement_id = ?
        WHERE id = ?
      `,
      [settlementId, order.id]
    );
  }

  return ok(
    request,
    env,
    {
      id: settlementId,
      worker_id: workerId,
      amount: totalAmount,
      orders_count: pendingOrders.length
    },
    201,
    '结算成功。'
  );
}

async function handleAdminDeleteSettlement(request, env, settlementId) {
  const settlement = await queryFirst(
    env.DB,
    `
      SELECT id, worker_id, amount, settlement_time, remark, created_at
      FROM settlements
      WHERE id = ?
    `,
    [settlementId]
  );

  if (!settlement) {
    return fail(request, env, 404, '结算记录不存在。', 'NOT_FOUND');
  }

  const relatedOrders = await queryAll(
    env.DB,
    `
      SELECT id
      FROM orders
      WHERE settlement_id = ?
    `,
    [settlementId]
  );

  await execute(
    env.DB,
    `
      UPDATE orders
      SET status = 'completed', settlement_id = NULL
      WHERE settlement_id = ?
    `,
    [settlementId]
  );

  await execute(env.DB, `DELETE FROM settlements WHERE id = ?`, [settlementId]);

  return ok(
    request,
    env,
    { id: settlementId, deleted: true, restored_orders: relatedOrders.length },
    200,
    '结算记录已删除，关联订单已恢复为待结算。'
  );
}

async function handleWorkerDeleteSettlement(request, env, authUser, settlementId) {
  const settlement = await queryFirst(
    env.DB,
    `
      SELECT id, worker_id, amount, settlement_time, remark, created_at
      FROM settlements
      WHERE id = ? AND worker_id = ?
    `,
    [settlementId, authUser.id]
  );

  if (!settlement) {
    return fail(request, env, 404, '结算记录不存在。', 'NOT_FOUND');
  }

  const relatedOrders = await queryAll(
    env.DB,
    `
      SELECT id
      FROM orders
      WHERE settlement_id = ?
    `,
    [settlementId]
  );

  await execute(
    env.DB,
    `
      UPDATE orders
      SET status = 'completed', settlement_id = NULL
      WHERE settlement_id = ?
    `,
    [settlementId]
  );

  await execute(env.DB, `DELETE FROM settlements WHERE id = ?`, [settlementId]);

  return ok(
    request,
    env,
    { id: settlementId, deleted: true, restored_orders: relatedOrders.length },
    200,
    '结算记录已删除，关联订单已恢复为待结算。'
  );
}

async function handleWorkerDashboard(request, env, authUser) {
  const incomeRow = await queryFirst(
    env.DB,
    `
      SELECT COALESCE(SUM(worker_income), 0) AS total
      FROM orders
      WHERE worker_id = ? AND is_deleted = 0 AND status != 'cancelled'
    `,
    [authUser.id]
  );
  const settledRow = await queryFirst(
    env.DB,
    `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM settlements
      WHERE worker_id = ?
    `,
    [authUser.id]
  );
  const orderCountRow = await queryFirst(
    env.DB,
    `
      SELECT COUNT(*) AS total
      FROM orders
      WHERE worker_id = ? AND is_deleted = 0
    `,
    [authUser.id]
  );

  const totalIncome = roundMoney(Number(incomeRow?.total || 0));
  const settledAmount = roundMoney(Number(settledRow?.total || 0));

  return ok(request, env, {
    totalIncome,
    settledAmount,
    unsettledAmount: roundMoney(totalIncome - settledAmount),
    orderCount: Number(orderCountRow?.total || 0)
  });
}

async function handleWorkerOrdersList(request, env, authUser) {
  const rows = await queryAll(
    env.DB,
    `${ORDER_SELECT_SQL} WHERE o.worker_id = ? AND o.is_deleted = 0 ORDER BY o.created_at DESC`,
    [authUser.id]
  );
  return ok(request, env, rows.map(normalizeOrderRow));
}

async function handleWorkerOrderDetail(request, env, authUser, orderId) {
  const order = await getOrderDetailForWorker(env.DB, orderId, authUser.id);
  if (!order) {
    return fail(request, env, 404, '订单不存在。', 'NOT_FOUND');
  }
  return ok(request, env, normalizeOrderRow(order));
}

async function handleWorkerDeleteOrder(request, env, authUser, orderId) {
  const order = await getOrderRecordForWorker(env.DB, orderId, authUser.id);
  return softDeleteOrder(request, env, order);
}

async function handleWorkerSettlementsList(request, env, authUser) {
  const rows = await queryAll(
    env.DB,
    `
      SELECT id, worker_id, amount, settlement_time, remark, created_at
      FROM settlements
      WHERE worker_id = ?
      ORDER BY settlement_time DESC
    `,
    [authUser.id]
  );
  return ok(request, env, rows.map(normalizeSettlementRow));
}

async function handleCustomerDashboard(request, env, authUser) {
  const balance = await getWalletBalance(env.DB, authUser.id);
  const rechargeTotalRow = await queryFirst(
    env.DB,
    `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM recharge_requests
      WHERE user_id = ? AND status = 'approved'
    `,
    [authUser.id]
  );
  const orderCountRow = await queryFirst(
    env.DB,
    `SELECT COUNT(*) AS total FROM orders WHERE customer_id = ? AND is_deleted = 0`,
    [authUser.id]
  );
  const inProgressCountRow = await queryFirst(
    env.DB,
    `
      SELECT COUNT(*) AS total
      FROM orders
      WHERE customer_id = ? AND is_deleted = 0 AND status IN ('pending_assignment', 'in_progress')
    `,
    [authUser.id]
  );
  const rechargeStatusRows = await queryAll(
    env.DB,
    `
      SELECT status, COUNT(*) AS total
      FROM recharge_requests
      WHERE user_id = ?
      GROUP BY status
    `,
    [authUser.id]
  );

  const rechargeStatus = { pending: 0, approved: 0, rejected: 0 };
  for (const item of rechargeStatusRows) {
    if (item.status in rechargeStatus) {
      rechargeStatus[item.status] = Number(item.total);
    }
  }

  return ok(request, env, {
    balance,
    cumulativeRecharge: roundMoney(Number(rechargeTotalRow?.total || 0)),
    rechargeStatus,
    orderCount: Number(orderCountRow?.total || 0),
    inProgressCount: Number(inProgressCountRow?.total || 0)
  });
}

async function handleCustomerProductsList(request, env) {
  const rows = await queryAll(
    env.DB,
    `
      SELECT id, game_name, service_name, unit_price, commission_rate, description, is_active, created_at
      FROM service_products
      WHERE is_active = 1
      ORDER BY created_at DESC
    `
  );
  return ok(
    request,
    env,
    rows.map((row) => ({
      ...row,
      unit_price: roundMoney(Number(row.unit_price)),
      commission_rate: Number(row.commission_rate),
      is_active: Boolean(row.is_active)
    }))
  );
}

async function handleCustomerCreateRechargeRequest(request, env, authUser) {
  const body = await parseJson(request);
  const amount = positiveNumber(body.amount);
  const paymentMethod = trimString(body.payment_method);
  const remark = optionalString(body.remark);
  const voucherUrl = optionalString(body.voucher_url);

  if (amount === null || !PAYMENT_METHODS.includes(paymentMethod)) {
    return fail(request, env, 400, '请填写正确的充值金额和支付方式。');
  }

  const rechargedAmount = roundMoney(amount);
  const reviewedAt = new Date().toISOString();
  const reviewRemark = '客户扫码支付后系统自动入账。';

  try {
    const result = await execute(
      env.DB,
      `
        INSERT INTO recharge_requests (
          user_id,
          amount,
          payment_method,
          voucher_url,
          remark,
          review_remark,
          status,
          reviewed_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'approved', ?)
      `,
      [authUser.id, rechargedAmount, paymentMethod, voucherUrl, remark, reviewRemark, reviewedAt]
    );

    const rechargeRequestId = Number(result.meta.last_row_id);

    await execute(
      env.DB,
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
      [authUser.id, rechargedAmount, rechargeRequestId, '客户扫码支付成功，系统自动入账。']
    );

    return ok(
      request,
      env,
      { id: rechargeRequestId, status: 'approved' },
      201,
      '充值成功，余额已入账。'
    );
  } catch (error) {
    return fail(request, env, 500, '充值入账失败，请稍后重试。', 'RECHARGE_CREATE_FAILED', String(error));
  }
}

async function handleCustomerRechargeRequestsList(request, env, authUser) {
  const rows = await queryAll(
    env.DB,
    `
      SELECT id, amount, payment_method, voucher_url, remark, review_remark, status, reviewed_at, created_at
      FROM recharge_requests
      WHERE user_id = ?
      ORDER BY created_at DESC
    `,
    [authUser.id]
  );
  return ok(request, env, rows.map(normalizeRechargeRow));
}

async function handleCustomerDeleteRechargeRequest(request, env, authUser, rechargeRequestId) {
  return deleteRechargeRequestWithRollback(request, env, rechargeRequestId, authUser.id);
}

async function handleCustomerCreateOrder(request, env, authUser) {
  const body = await parseJson(request);
  const productId = optionalId(body.product_id);
  const durationHours = positiveNumber(body.duration_hours);
  const remark = optionalString(body.remark);
  const orderTime = trimString(body.order_time) || new Date().toISOString();

  if (!productId || durationHours === null) {
    return fail(request, env, 400, '请选择服务项目并填写时长。');
  }

  const product = await getProductById(env.DB, productId);
  if (!product || !product.is_active) {
    return fail(request, env, 400, '服务项目不存在或未启用。');
  }

  const unitPrice = roundMoney(Number(product.unit_price));
  const totalAmount = roundMoney(durationHours * unitPrice);
  const commissionAmount = roundMoney(totalAmount * Number(product.commission_rate));
  const workerIncome = roundMoney(totalAmount - commissionAmount);
  const walletBalance = await getWalletBalance(env.DB, authUser.id);

  if (walletBalance < totalAmount) {
    return fail(request, env, 400, '余额不足，请先充值。');
  }

  const { orderId, orderNo } = await insertOrderWithRetry(env.DB, {
    customerId: authUser.id,
    workerId: null,
    productId,
    orderTime,
    durationHours,
    unitPrice,
    totalAmount,
    commissionAmount,
    workerIncome,
    status: 'pending_assignment',
    remark
  });
  await execute(
    env.DB,
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

  const order = await getOrderDetailForCustomer(env.DB, orderId, authUser.id);
  return ok(request, env, normalizeOrderRow(order), 201, '订单创建成功。');
}

async function handleCustomerOrdersList(request, env, authUser) {
  const rows = await queryAll(
    env.DB,
    `${ORDER_SELECT_SQL} WHERE o.customer_id = ? AND o.is_deleted = 0 ORDER BY o.created_at DESC`,
    [authUser.id]
  );
  return ok(request, env, rows.map(normalizeOrderRow));
}

async function handleCustomerOrderDetail(request, env, authUser, orderId) {
  const order = await getOrderDetailForCustomer(env.DB, orderId, authUser.id);
  if (!order) {
    return fail(request, env, 404, '订单不存在。', 'NOT_FOUND');
  }
  return ok(request, env, normalizeOrderRow(order));
}

async function handleCustomerDeleteOrder(request, env, authUser, orderId) {
  const order = await getOrderRecordForCustomer(env.DB, orderId, authUser.id);
  return softDeleteOrder(request, env, order);
}
