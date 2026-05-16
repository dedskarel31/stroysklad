BEGIN;

CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  login VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'storekeeper'))
);

CREATE TABLE IF NOT EXISTS materials (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  article VARCHAR(100) NOT NULL UNIQUE,
  unit VARCHAR(50) NOT NULL,
  min_quantity NUMERIC(14, 3) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock_balances (
  id BIGSERIAL PRIMARY KEY,
  material_id BIGINT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  quantity NUMERIC(14, 3) NOT NULL DEFAULT 0,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_stock_balances_material_id
  ON stock_balances(material_id);

CREATE TABLE IF NOT EXISTS operations (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  material_id BIGINT NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  quantity NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
  date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL
);

COMMIT;
