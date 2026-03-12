PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'worker', 'customer')),
  display_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_name TEXT NOT NULL,
  service_name TEXT NOT NULL,
  unit_price REAL NOT NULL,
  commission_rate REAL NOT NULL DEFAULT 0.20,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recharge_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('alipay', 'wechat')),
  voucher_url TEXT,
  remark TEXT,
  review_remark TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  settlement_time TEXT NOT NULL,
  remark TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL,
  worker_id INTEGER,
  product_id INTEGER NOT NULL,
  settlement_id INTEGER,
  order_time TEXT NOT NULL,
  duration_hours REAL NOT NULL,
  unit_price REAL NOT NULL,
  total_amount REAL NOT NULL,
  commission_amount REAL NOT NULL,
  worker_income REAL NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN (
      'pending_recharge',
      'pending_assignment',
      'in_progress',
      'completed',
      'settled',
      'cancelled'
    )
  ),
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1)),
  remark TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (worker_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES service_products(id),
  FOREIGN KEY (settlement_id) REFERENCES settlements(id)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('recharge', 'order_deduct', 'refund', 'adjust')),
  amount REAL NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  related_order_id INTEGER,
  related_recharge_request_id INTEGER,
  remark TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (related_order_id) REFERENCES orders(id),
  FOREIGN KEY (related_recharge_request_id) REFERENCES recharge_requests(id)
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_products_active ON service_products(is_active);
CREATE INDEX IF NOT EXISTS idx_recharge_requests_user_id ON recharge_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_recharge_requests_status ON recharge_requests(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_related_order ON wallet_transactions(related_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_worker_id ON orders(worker_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_is_deleted ON orders(is_deleted);
CREATE INDEX IF NOT EXISTS idx_settlements_worker_id ON settlements(worker_id);
