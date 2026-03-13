ALTER TABLE orders ADD COLUMN customer_completed INTEGER NOT NULL DEFAULT 0 CHECK (customer_completed IN (0, 1));
ALTER TABLE orders ADD COLUMN customer_completed_at TEXT;
ALTER TABLE orders ADD COLUMN worker_completed INTEGER NOT NULL DEFAULT 0 CHECK (worker_completed IN (0, 1));
ALTER TABLE orders ADD COLUMN worker_completed_at TEXT;
