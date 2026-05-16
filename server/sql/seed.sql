BEGIN;

-- Тестовый администратор: login admin, пароль admin123 (bcrypt hash).
INSERT INTO employees (login, password_hash, role)
VALUES (
  'admin',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin'
)
ON CONFLICT (login) DO NOTHING;

COMMIT;
