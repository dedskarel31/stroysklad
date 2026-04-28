BEGIN;

-- Тестовый администратор: login admin, пароль admin123 (bcrypt hash).
INSERT INTO employees (login, password_hash, role)
VALUES (
  'admin',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin'
)
ON CONFLICT (login) DO NOTHING;

INSERT INTO materials (name, article, unit, min_quantity)
VALUES
  ('Цемент', 'CEM-001', 'мешок', 50),
  ('Кирпич', 'BRK-001', 'шт', 500),
  ('Песок', 'SND-001', 'т', 10)
ON CONFLICT (article) DO NOTHING;

INSERT INTO stock_balances (material_id, quantity, last_updated)
SELECT m.id, v.quantity, NOW()
FROM (
  VALUES
    ('CEM-001', 120::NUMERIC),
    ('BRK-001', 800::NUMERIC),
    ('SND-001', 5::NUMERIC)
) AS v(article, quantity)
JOIN materials m ON m.article = v.article
ON CONFLICT (material_id) DO NOTHING;

COMMIT;
