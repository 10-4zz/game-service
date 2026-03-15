CREATE TABLE IF NOT EXISTS worker_withdraw_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  withdraw_method TEXT NOT NULL CHECK (withdraw_method IN ('alipay', 'wechat', 'bank')),
  account_name TEXT NOT NULL,
  account_no TEXT NOT NULL,
  remark TEXT,
  review_remark TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_worker_withdraw_requests_worker_id ON worker_withdraw_requests(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_withdraw_requests_status ON worker_withdraw_requests(status);
