/**
 * Тестовые данные: материалы, остатки, журнал операций.
 */
import bcrypt from 'bcryptjs';
import { pool } from './src/db/database.js';

const MATERIALS = [
  { name: 'Цемент М500', unit: 'кг', min_quantity: 500, quantity: 300 },
  { name: 'Арматура А500С 12мм', unit: 'т', min_quantity: 2, quantity: 5 },
  { name: 'Кирпич рядовой М150', unit: 'шт', min_quantity: 1000, quantity: 500 },
  { name: 'Пеноблок 600x300x200', unit: 'шт', min_quantity: 200, quantity: 350 },
  { name: 'Песок строительный', unit: 'м³', min_quantity: 5, quantity: 12 },
  { name: 'Щебень фракция 20-40', unit: 'м³', min_quantity: 3, quantity: 8 },
  { name: 'Доска обрезная 50x150', unit: 'п.м.', min_quantity: 100, quantity: 200 },
];

export async function runSeed({ closePool = true } = {}) {
  const adminHash = await bcrypt.hash('Admin123', 10);
  const userHash = await bcrypt.hash('User123', 10);

  await pool.query(
    `INSERT INTO employees (username, password_hash, role, full_name) VALUES
      ('admin', $1, 'admin', 'Иванов И.И.'),
      ('sklad1', $2, 'user', 'Петров П.П.')
     ON CONFLICT (username) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role,
       full_name = EXCLUDED.full_name`,
    [adminHash, userHash],
  );

  for (const item of MATERIALS) {
    const { rows } = await pool.query(
      `INSERT INTO materials (name, unit, min_quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET unit = EXCLUDED.unit, min_quantity = EXCLUDED.min_quantity
       RETURNING id`,
      [item.name, item.unit, item.min_quantity],
    );
    await pool.query(
      `INSERT INTO stock (material_id, quantity) VALUES ($1, $2)
       ON CONFLICT (material_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
      [rows[0].id, item.quantity],
    );
  }

  const { rows: employees } = await pool.query(
    `SELECT id, username FROM employees WHERE username IN ('admin', 'sklad1')`,
  );
  const adminId = employees.find((e) => e.username === 'admin')?.id;
  const skladId = employees.find((e) => e.username === 'sklad1')?.id;
  const { rows: materials } = await pool.query(`SELECT id, name FROM materials`);

  const findMat = (part) => materials.find((m) => m.name.includes(part))?.id;
  const samples = [
    { material_id: findMat('Цемент'), employee_id: adminId, type: 'income', quantity: 200, comment: 'Поставка от поставщика', daysAgo: 5 },
    { material_id: findMat('Кирпич'), employee_id: skladId, type: 'expense', quantity: 100, comment: 'Выдача на объект №3', daysAgo: 3 },
    { material_id: findMat('Песок'), employee_id: skladId, type: 'income', quantity: 10, comment: 'Приход песка', daysAgo: 2 },
    { material_id: findMat('Цемент'), employee_id: skladId, type: 'expense', quantity: 50, comment: 'Расход на штукатурные работы', daysAgo: 1 },
  ].filter((s) => s.material_id && s.employee_id);

  for (const s of samples) {
    const exists = await pool.query(
      `SELECT 1 FROM transactions
       WHERE material_id = $1 AND comment = $2 LIMIT 1`,
      [s.material_id, s.comment],
    );
    if (exists.rows.length > 0) continue;

    await pool.query(
      `INSERT INTO transactions (material_id, employee_id, type, quantity, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW() - ($6 || ' days')::interval)`,
      [s.material_id, s.employee_id, s.type, s.quantity, s.comment, String(s.daysAgo)],
    );
  }

  if (closePool) {
    await pool.end();
  }
}

const isMain = process.argv[1]?.endsWith('seed.js');
if (isMain) {
  runSeed()
    .then(() => console.log('[seed] Тестовые данные загружены.'))
    .catch((e) => {
      console.error('[seed]', e);
      process.exit(1);
    });
}
