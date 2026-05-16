BEGIN;

-- Тестовый администратор: login admin, пароль admin123 (bcrypt hash).
INSERT INTO employees (login, password_hash, role)
VALUES (
  'admin',
  '$2b$10$NRmJdIpJBCPXb83GxbMX8u9CBL0l9bqCPqpGPEbIbWP80htJv9LAe',
  'admin'
)
ON CONFLICT (login) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role
WHERE employees.login = 'admin';

COMMIT;
