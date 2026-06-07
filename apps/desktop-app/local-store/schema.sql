PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS local_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role_code TEXT NOT NULL,
  branch_id TEXT,
  token TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS products_cache (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  name TEXT NOT NULL,
  category_name TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS branch_prices_cache (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  price INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  UNIQUE (branch_id, product_id)
);

CREATE TABLE IF NOT EXISTS inventory_balances_local (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  minimum_quantity REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  UNIQUE (branch_id, product_id)
);

CREATE TABLE IF NOT EXISTS stock_movements_local (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'sales_transaction',
  source_id TEXT,
  movement_type TEXT NOT NULL,
  quantity_delta REAL NOT NULL,
  quantity_before REAL,
  quantity_after REAL,
  reason_code TEXT NOT NULL,
  notes TEXT,
  performed_by_user_id TEXT,
  occurred_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS sales_transactions_local (
  id TEXT PRIMARY KEY,
  transaction_no TEXT NOT NULL UNIQUE,
  branch_id TEXT NOT NULL,
  register_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  shift_id TEXT,
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount_total INTEGER NOT NULL DEFAULT 0,
  tax_total INTEGER NOT NULL DEFAULT 0,
  grand_total INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_transaction_items_local (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES sales_transactions_local(id),
  product_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price INTEGER NOT NULL,
  discount_total INTEGER NOT NULL DEFAULT 0,
  subtotal INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS payments_local (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES sales_transactions_local(id),
  method TEXT NOT NULL,
  amount INTEGER NOT NULL,
  amount_received INTEGER,
  status TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS shifts_local (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  register_id TEXT NOT NULL,
  opened_by_user_id TEXT NOT NULL,
  closed_by_user_id TEXT,
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  opening_cash_amount INTEGER DEFAULT 0,
  closing_cash_amount INTEGER,
  status TEXT NOT NULL DEFAULT 'open',
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shifts_local_open_register
ON shifts_local(register_id)
WHERE status = 'open';

CREATE TABLE IF NOT EXISTS sync_queue_local (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  event_version INTEGER NOT NULL DEFAULT 1,
  branch_id TEXT NOT NULL,
  source_system TEXT NOT NULL DEFAULT 'branch_app',
  source_mode TEXT NOT NULL DEFAULT 'online',
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  next_retry_at TEXT,
  last_error_code TEXT,
  last_error_message TEXT,
  acknowledged_at TEXT,
  ack_status TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_local_status ON sync_queue_local(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_local_retry ON sync_queue_local(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_transactions_local_sync_status ON sales_transactions_local(sync_status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_local_sync_status ON stock_movements_local(sync_status);
CREATE INDEX IF NOT EXISTS idx_payments_local_sync_status ON payments_local(sync_status);
CREATE INDEX IF NOT EXISTS idx_shifts_local_sync_status ON shifts_local(sync_status);
