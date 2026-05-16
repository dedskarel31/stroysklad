-- ============================================================
-- ИС "СтройСклад" — физическая схема БД (соответствует разделу 2.5.3 диплома)
-- 4 таблицы: employees, materials, stock, transactions
-- ============================================================

-- Очистка (для пересоздания на чистой Railway-базе)
DROP TRIGGER  IF EXISTS materials_after_insert ON materials;
DROP FUNCTION IF EXISTS create_stock_row();
DROP TABLE    IF EXISTS transactions CASCADE;
DROP TABLE    IF EXISTS stock        CASCADE;
DROP TABLE    IF EXISTS materials    CASCADE;
DROP TABLE    IF EXISTS employees    CASCADE;

-- 1.1 Сотрудники (пользователи системы)
CREATE TABLE employees (
    id            SERIAL       PRIMARY KEY,
    username      VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT         NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'user')),
    full_name     VARCHAR(255),
    created_at    TIMESTAMP    DEFAULT NOW()
);

-- 1.2 Справочник материалов
CREATE TABLE materials (
    id           SERIAL         PRIMARY KEY,
    name         VARCHAR(255)   UNIQUE NOT NULL,
    unit         VARCHAR(50)    NOT NULL,
    min_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
    created_at   TIMESTAMP      DEFAULT NOW()
);

-- 1.3 Текущие остатки
CREATE TABLE stock (
    material_id INTEGER        PRIMARY KEY REFERENCES materials(id) ON DELETE CASCADE,
    quantity    NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0)
);

-- 1.4 Журнал операций
CREATE TABLE transactions (
    id          SERIAL         PRIMARY KEY,
    material_id INTEGER        NOT NULL REFERENCES materials(id),
    employee_id INTEGER        NOT NULL REFERENCES employees(id),
    type        VARCHAR(10)    NOT NULL CHECK (type IN ('income', 'expense')),
    quantity    NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    comment     TEXT,
    created_at  TIMESTAMP      DEFAULT NOW()
);

-- Индексы (НТ-1: время отклика до 2 секунд)
CREATE INDEX idx_transactions_material_id ON transactions(material_id);
CREATE INDEX idx_transactions_created_at  ON transactions(created_at);
CREATE INDEX idx_transactions_type        ON transactions(type);

-- Триггер: при добавлении материала автоматически создаётся строка остатка
CREATE OR REPLACE FUNCTION create_stock_row()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO stock (material_id, quantity) VALUES (NEW.id, 0)
    ON CONFLICT (material_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER materials_after_insert
AFTER INSERT ON materials
FOR EACH ROW EXECUTE FUNCTION create_stock_row();
