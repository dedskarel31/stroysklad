/**
 * Принудительно сбросить admin → admin123.
 * Запуск: npm run db:reset-admin
 */
import bcrypt from 'bcryptjs';
import { pool } from './database.js';

const LOGIN = 'admin';
const PASSWORD = 'admin123';

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id BIGSERIAL PRIMARY KEY,
      login VARCHAR(100) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'storekeeper'))
    )
  `);

  const { rows } = await pool.query(
    `INSERT INTO employees (login, password_hash, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (login) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = 'admin'
     RETURNING id, login, role`,
    [LOGIN, passwordHash],
  );

  console.log(`[DB] Готово: ${rows[0].login} / ${PASSWORD} (роль ${rows[0].role})`);
}

main()
  .catch((e) => {
    console.error('[DB]', e.message);
    process.exit(1);
  })
  .finally(() => pool.end());
