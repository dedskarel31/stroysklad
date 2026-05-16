-- Сотрудники (пароли задаются в seed.js с корректными bcrypt-хешами)

BEGIN;

INSERT INTO employees (username, password_hash, role, full_name) VALUES
  ('admin', '$2b$10$LbT74sMNfWr.Gm8Q4T9wkuYyFr.xZCH1/e6oo7jKdHYtc5TwdEDz2', 'admin', 'Иванов И.И.'),
  ('sklad1', '$2b$10$uyf9NqmIysib19rAQCRonuJNbmLVYolHsh31jUn.sv/bIsjmAA9Kq', 'user', 'Петров П.П.')
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;

COMMIT;
