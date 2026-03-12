ALTER TABLE orders ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1));
CREATE INDEX IF NOT EXISTS idx_orders_is_deleted ON orders(is_deleted);
