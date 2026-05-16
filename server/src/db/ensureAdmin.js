import bcrypt from 'bcryptjs';
import { pool } from './database.js';

const DEFAULT_LOGIN = 'admin';
const DEFAULT_PASSWORD = 'admin123';

/**
 * Гарантирует тестового администратора admin/admin123 (см. README).
 * При старте создаёт пользователя или обновляет пароль, если он был битым.
 */
export async function ensureDefaultAdmin() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id BIGSERIAL PRIMARY KEY,
      login VARCHAR(100) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'storekeeper'))
    )
  `);

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const { rowCount } = await pool.query(
    `INSERT INTO employees (login, password_hash, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (login) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role
     WHERE employees.login = $1`,
    [DEFAULT_LOGIN, passwordHash],
  );

  if (rowCount > 0) {
    console.log(`[DB] Тестовый админ: ${DEFAULT_LOGIN} / ${DEFAULT_PASSWORD}`);
  }
}
