PRAGMA foreign_keys = OFF;

DELETE FROM wallet_transactions;
DELETE FROM orders;
DELETE FROM settlements;
DELETE FROM worker_withdraw_requests;
DELETE FROM refund_requests;
DELETE FROM recharge_requests;
DELETE FROM service_products;
DELETE FROM users;

DELETE FROM sqlite_sequence WHERE name IN (
  'users',
  'service_products',
  'recharge_requests',
  'refund_requests',
  'worker_withdraw_requests',
  'wallet_transactions',
  'orders',
  'settlements'
);

INSERT INTO users (id, username, password_hash, role, display_name, created_at) VALUES
  (1, 'admin', 'ac0e7d037817094e9e0b4441f9bae3209d67b02fa484917065f71b16109a1a78', 'admin', '平台老板', '2026-03-01 09:00:00'),
  (2, 'worker_ares', 'd6175c858913d6ace59ed2a78846dafd80494f926977eeb7c6853a83d75484f0', 'worker', '阿瑞斯', '2026-03-01 09:10:00'),
  (3, 'worker_luna', '103d824ebbb51052f421a1c1a29389e27793eeec21daa7490868442a1104bac3', 'worker', '露娜', '2026-03-01 09:20:00'),
  (4, 'customer_kevin', 'a07e51c008bfe6991af4a5783fbb960e1e88ad1586f92b230c40de1bfc55fd46', 'customer', '凯文', '2026-03-01 09:30:00'),
  (5, 'customer_mia', '7f11f04260526f7f9754eed165d9793333dd423b56c8f772fe4f63bf0bab3323', 'customer', '米娅', '2026-03-01 09:40:00');

INSERT INTO service_products (id, game_name, service_name, unit_price, commission_rate, description, is_active, created_at) VALUES
  (1, '英雄联盟', '段位代练', 120.00, 0.20, '单双排上分，按小时结算。', 1, '2026-03-01 10:00:00'),
  (2, '王者荣耀', '陪玩上分', 68.00, 0.18, '支持语音沟通，按小时下单。', 1, '2026-03-01 10:05:00'),
  (3, '永劫无间', '技术陪练', 88.00, 0.15, '竞技陪练，适合训练和上手。', 1, '2026-03-01 10:10:00'),
  (4, '云顶之弈', '双排陪玩', 58.00, 0.18, '阵容教学 + 实战双排。', 1, '2026-03-01 10:15:00'),
  (5, 'CS2', '定级代打', 150.00, 0.22, '暂未开放接单。', 0, '2026-03-01 10:20:00');

INSERT INTO recharge_requests (id, user_id, amount, payment_method, voucher_url, remark, review_remark, status, reviewed_by, reviewed_at, created_at) VALUES
  (1, 4, 700.00, 'alipay', 'https://example.com/voucher/kevin-700', '支付宝扫码充值 700 元', '已核对到账。', 'approved', 1, '2026-03-01 11:05:00', '2026-03-01 11:00:00'),
  (2, 4, 150.00, 'wechat', 'https://example.com/voucher/kevin-150', '晚间补充充值', NULL, 'pending', NULL, NULL, '2026-03-10 20:15:00'),
  (3, 5, 450.00, 'wechat', 'https://example.com/voucher/mia-450', '微信转账 450 元', '金额匹配，已入账。', 'approved', 1, '2026-03-02 09:35:00', '2026-03-02 09:20:00'),
  (4, 5, 100.00, 'alipay', 'https://example.com/voucher/mia-100', '备注金额不清晰', '凭证与金额不一致。', 'rejected', 1, '2026-03-06 14:00:00', '2026-03-06 13:40:00');

INSERT INTO settlements (id, worker_id, amount, settlement_time, remark, created_at) VALUES
  (1, 2, 192.00, '2026-03-05 18:00:00', '第一批已完成订单结算', '2026-03-05 18:00:00');

INSERT INTO refund_requests (id, user_id, amount, remark, review_remark, status, reviewed_by, reviewed_at, created_at) VALUES
  (1, 4, 180.00, '申请退回部分闲置余额', '已线下退款，平台同步扣减余额。', 'approved', 1, '2026-03-06 16:20:00', '2026-03-06 15:50:00'),
  (2, 5, 80.00, '本周暂时不用，申请退回余额。', NULL, 'pending', NULL, NULL, '2026-03-10 12:10:00');

INSERT INTO worker_withdraw_requests (
  id,
  worker_id,
  amount,
  withdraw_method,
  account_name,
  account_no,
  remark,
  review_remark,
  status,
  reviewed_by,
  reviewed_at,
  created_at
) VALUES
  (1, 2, 50.00, 'alipay', '阿瑞斯', 'ares-alipay@example.com', '先提现一部分到支付宝。', '已线下打款。', 'approved', 1, '2026-03-06 19:00:00', '2026-03-06 18:30:00'),
  (2, 2, 30.00, 'bank', '阿瑞斯', '6222020202020202020', '本周剩余收入继续提现。', NULL, 'pending', NULL, NULL, '2026-03-10 18:10:00');

INSERT INTO orders (
  id,
  order_no,
  customer_id,
  worker_id,
  product_id,
  settlement_id,
  order_time,
  duration_hours,
  unit_price,
  total_amount,
  commission_amount,
  worker_income,
  customer_completed,
  customer_completed_at,
  worker_completed,
  worker_completed_at,
  status,
  remark,
  created_at
) VALUES
  (1, 'GSP202603010001', 4, 2, 1, 1, '2026-03-01 20:00:00', 2.00, 120.00, 240.00, 48.00, 192.00, 1, '2026-03-01 21:50:00', 1, '2026-03-01 21:45:00', 'settled', '晚间排位冲分。', '2026-03-01 18:30:00'),
  (2, 'GSP202603090001', 4, 2, 2, NULL, '2026-03-09 21:00:00', 3.00, 68.00, 204.00, 36.72, 167.28, 0, NULL, 0, NULL, 'in_progress', '三排连麦，持续陪玩。', '2026-03-09 19:00:00'),
  (3, 'GSP202603020001', 5, 3, 3, NULL, '2026-03-02 20:30:00', 3.00, 88.00, 264.00, 39.60, 224.40, 0, NULL, 1, '2026-03-02 23:30:00', 'completed', '打手已确认完成，等待客户确认。', '2026-03-02 18:00:00'),
  (4, 'GSP202603080001', 5, NULL, 4, NULL, '2026-03-08 19:30:00', 2.00, 58.00, 116.00, 20.88, 95.12, 0, NULL, 0, NULL, 'pending_assignment', '等待安排擅长运营阵容的陪玩。', '2026-03-08 18:20:00'),
  (5, 'GSP202603070001', 4, NULL, 4, NULL, '2026-03-07 16:00:00', 1.00, 58.00, 58.00, 10.44, 47.56, 0, NULL, 0, NULL, 'cancelled', '用户临时取消。', '2026-03-07 15:30:00'),
  (6, 'GSP202603100001', 4, 2, 2, NULL, '2026-03-10 22:00:00', 5.00, 68.00, 340.00, 61.20, 278.80, 1, '2026-03-10 23:10:00', 1, '2026-03-10 23:05:00', 'pending_recharge', '双方已确认完成，等待补充余额后自动结算。', '2026-03-10 21:10:00');

INSERT INTO wallet_transactions (
  id,
  user_id,
  type,
  amount,
  direction,
  related_order_id,
  related_recharge_request_id,
  remark,
  created_at
) VALUES
  (1, 4, 'recharge', 700.00, 'in', NULL, 1, '充值申请通过，余额入账。', '2026-03-01 11:05:10'),
  (2, 5, 'recharge', 450.00, 'in', NULL, 3, '充值申请通过，余额入账。', '2026-03-02 09:35:10'),
  (3, 4, 'order_deduct', 240.00, 'out', 1, NULL, '订单 GSP202603010001 扣款。', '2026-03-01 18:30:10'),
  (4, 4, 'refund', 180.00, 'out', NULL, NULL, '退款申请 #1 审核通过，线下退款后平台扣减余额。', '2026-03-06 16:20:10');

PRAGMA foreign_keys = ON;
