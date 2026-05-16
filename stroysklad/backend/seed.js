// Тестовые данные для демонстрации (часть 6 промпта / диплом)
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const employees = [
  { username: 'admin',  password: 'Admin123', full_name: 'Иванов Иван Иванович',     role: 'admin' },
  { username: 'sklad1', password: 'User123',  full_name: 'Петров Пётр Петрович',     role: 'user' },
  { username: 'sklad2', password: 'User123',  full_name: 'Сидорова Анна Сергеевна',  role: 'user' },
];

const materials = [
  { name: 'Цемент М500',            unit: 'кг',   min_quantity: 500,  initial: 300  },
  { name: 'Арматура А500С 12мм',    unit: 'т',    min_quantity: 2,    initial: 5    },
  { name: 'Кирпич рядовой М150',    unit: 'шт',   min_quantity: 1000, initial: 500  },
  { name: 'Пеноблок 600x300x200',   unit: 'шт',   min_quantity: 200,  initial: 350  },
  { name: 'Песок строительный',     unit: 'м³',   min_quantity: 5,    initial: 12   },
  { name: 'Щебень фракция 20-40',   unit: 'м³',   min_quantity: 3,    initial: 8    },
  { name: 'Доска обрезная 50x150',  unit: 'п.м.', min_quantity: 100,  initial: 200  },
];

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Чистим таблицы (без удаления самих таблиц)
    await client.query('TRUNCATE transactions, stock, materials, employees RESTART IDENTITY CASCADE');

    // Сотрудники
    console.log('[seed] Создаю сотрудников...');
    const employeeIds = {};
    for (const e of employees) {
      const hash = await bcrypt.hash(e.password, 10);
      const r = await client.query(
        `INSERT INTO employees (username, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [e.username, hash, e.full_name, e.role]
      );
      employeeIds[e.username] = r.rows[0].id;
      console.log(`  + ${e.username} (${e.role})`);
    }

    // Материалы (триггер создаёт строки stock с quantity=0)
    console.log('[seed] Создаю материалы...');
    const materialIds = {};
    for (const m of materials) {
      const r = await client.query(
        `INSERT INTO materials (name, unit, min_quantity)
         VALUES ($1, $2, $3) RETURNING id`,
        [m.name, m.unit, m.min_quantity]
      );
      materialIds[m.name] = r.rows[0].id;
      // Устанавливаем начальный остаток
      await client.query(
        `UPDATE stock SET quantity = $1 WHERE material_id = $2`,
        [m.initial, r.rows[0].id]
      );
      const deficit = m.initial < m.min_quantity ? ' ⚠ ДЕФИЦИТ' : '';
      console.log(`  + ${m.name}: ${m.initial} ${m.unit} (мин: ${m.min_quantity})${deficit}`);
    }

    // Несколько операций в журнале для демонстрации
    console.log('[seed] Создаю операции в журнале...');
    const demoOps = [
      { mat: 'Цемент М500',           type: 'income',  qty: 1000, emp: 'admin',  comment: 'Поставка от ООО "СтройМатериалы"', daysAgo: 10 },
      { mat: 'Цемент М500',           type: 'expense', qty: 700,  emp: 'sklad1', comment: 'Объект "Жилой комплекс Север"',     daysAgo: 7  },
      { mat: 'Арматура А500С 12мм',   type: 'income',  qty: 8,    emp: 'admin',  comment: 'Поставка по договору №14/2026',     daysAgo: 6  },
      { mat: 'Арматура А500С 12мм',   type: 'expense', qty: 3,    emp: 'sklad1', comment: 'Армирование фундамента',            daysAgo: 4  },
      { mat: 'Кирпич рядовой М150',   type: 'expense', qty: 500,  emp: 'sklad2', comment: 'Кладка стен 1 этажа',               daysAgo: 3  },
      { mat: 'Песок строительный',    unit: 'м³', type: 'income', qty: 15,   emp: 'admin',  comment: 'Карьер "Белгородский"',  daysAgo: 5  },
      { mat: 'Песок строительный',    type: 'expense', qty: 3,    emp: 'sklad1', comment: 'Стяжка пола',                       daysAgo: 1  },
      { mat: 'Пеноблок 600x300x200',  type: 'income',  qty: 500,  emp: 'admin',  comment: 'Поставка от ООО "Пенобетон-Юг"',    daysAgo: 8  },
      { mat: 'Пеноблок 600x300x200',  type: 'expense', qty: 150,  emp: 'sklad2', comment: 'Перегородки санузлов',              daysAgo: 2  },
    ];

    for (const op of demoOps) {
      const matId = materialIds[op.mat];
      const empId = employeeIds[op.emp];
      await client.query(
        `INSERT INTO transactions (material_id, employee_id, type, quantity, comment, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '1 day' * $6)`,
        [matId, empId, op.type, op.qty, op.comment, op.daysAgo]
      );
    }
    console.log(`  + ${demoOps.length} операций добавлено`);

    await client.query('COMMIT');
    console.log('[seed] ✓ Готово!');
    console.log('');
    console.log('Учётные записи для входа:');
    console.log('  Администратор: admin / Admin123');
    console.log('  Кладовщик:     sklad1 / User123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] Ошибка:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
