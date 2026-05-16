/**
 * Назначить пользователя администратором.
 * Запуск: npm run db:promote -- ВАШ_ЛОГИН
 */
import { pool } from './database.js';

const login = process.argv[2]?.trim();

if (!login) {
  console.error('Укажите логин: npm run db:promote -- ivanov');
  process.exit(1);
}

async function main() {
  try {
    const { rows } = await pool.query(
      `UPDATE employees SET role = 'admin' WHERE login = $1 RETURNING id, login, role`,
      [login],
    );

    if (!rows[0]) {
      console.error(`Пользователь "${login}" не найден. Сначала зарегистрируйтесь на сайте.`);
      process.exit(1);
    }

    console.log(`[DB] Готово: ${rows[0].login} — роль «${rows[0].role}»`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error('[DB]', e.message);
  process.exit(1);
});
