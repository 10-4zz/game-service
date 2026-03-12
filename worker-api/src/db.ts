import type { OrderDetailRow, ProductRow, UserRow } from './types';

export async function queryAll<T>(db: D1Database, sql: string, params: unknown[] = []) {
  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<T>();

  return (result.results ?? []) as T[];
}

export async function queryFirst<T>(db: D1Database, sql: string, params: unknown[] = []) {
  const result = await db
    .prepare(sql)
    .bind(...params)
    .first<T>();

  return result ?? null;
}

export async function execute(db: D1Database, sql: string, params: unknown[] = []) {
  return db
    .prepare(sql)
    .bind(...params)
    .run();
}

export function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

export function generateOrderNo() {
  const now = new Date();
  const parts = [
    now.getUTCFullYear().toString(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
    String(now.getUTCHours()).padStart(2, '0'),
    String(now.getUTCMinutes()).padStart(2, '0'),
    String(now.getUTCSeconds()).padStart(2, '0'),
    String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  ];

  return `GSP${parts.join('')}`;
}

export async function getWalletBalance(db: D1Database, userId: number) {
  const row = await queryFirst<{ balance: number | null }>(
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

  return roundMoney(Number(row?.balance ?? 0));
}

export async function getUserByUsername(db: D1Database, username: string) {
  return queryFirst<UserRow>(
    db,
    `
      SELECT id, username, password_hash, role, display_name, is_active, created_at
      FROM users
      WHERE username = ?
    `,
    [username]
  );
}

export async function getUserById(db: D1Database, userId: number) {
  return queryFirst<UserRow>(
    db,
    `
      SELECT id, username, password_hash, role, display_name, is_active, created_at
      FROM users
      WHERE id = ?
    `,
    [userId]
  );
}

export async function getProductById(db: D1Database, productId: number) {
  return queryFirst<ProductRow>(
    db,
    `
      SELECT id, game_name, service_name, unit_price, commission_rate, description, is_active, created_at
      FROM service_products
      WHERE id = ?
    `,
    [productId]
  );
}

const orderSelect = `
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

export async function getOrderDetailById(db: D1Database, orderId: number) {
  return queryFirst<OrderDetailRow>(
    db,
    `${orderSelect} WHERE o.id = ?`,
    [orderId]
  );
}

export async function getOrderDetailForWorker(db: D1Database, orderId: number, workerId: number) {
  return queryFirst<OrderDetailRow>(
    db,
    `${orderSelect} WHERE o.id = ? AND o.worker_id = ?`,
    [orderId, workerId]
  );
}

export async function getOrderDetailForCustomer(
  db: D1Database,
  orderId: number,
  customerId: number
) {
  return queryFirst<OrderDetailRow>(
    db,
    `${orderSelect} WHERE o.id = ? AND o.customer_id = ?`,
    [orderId, customerId]
  );
}

export function getOrderSelectSql() {
  return orderSelect;
}
