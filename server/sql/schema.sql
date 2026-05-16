-- Схема БД «СтройСклад» — 4 таблицы по дипломному заданию

BEGIN;

-- Удаление устаревших таблиц предыдущей версии системы
DROP TABLE IF EXISTS operations CASCADE;
DROP TABLE IF EXISTS stock_balances CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS stock CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE materials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  unit VARCHAR(50) NOT NULL,
  min_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stock (
  material_id INTEGER PRIMARY KEY REFERENCES materials(id) ON DELETE CASCADE,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0)
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_material_id ON transactions(material_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

CREATE OR REPLACE FUNCTION create_stock_for_material()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stock (material_id, quantity) VALUES (NEW.id, 0)
  ON CONFLICT (material_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_materials_create_stock ON materials;
CREATE TRIGGER trg_materials_create_stock
  AFTER INSERT ON materials
  FOR EACH ROW
  EXECUTE FUNCTION create_stock_for_material();

COMMIT;
