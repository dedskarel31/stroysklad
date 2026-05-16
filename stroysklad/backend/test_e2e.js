// Прогоняем 12 тест-кейсов из таблицы 3.4 диплома + доп. проверки
// БЕЗ запуска HTTP-сервера — express обрабатывает запросы в том же процессе.
process.env.JWT_SECRET = 'test';
process.env.DATABASE_URL = 'postgresql://stroysklad:test123@localhost:5432/stroysklad_test';

const request = require('supertest');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const materialsRoutes = require('./routes/materials');
const stockRoutes = require('./routes/stock');
const transactionsRoutes = require('./routes/transactions');
const employeesRoutes = require('./routes/employees');
const pool = require('./db');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/employees', employeesRoutes);

let pass = 0, fail = 0;
const t = (name, ok, extra = '') => {
  if (ok) { console.log(`  \u2713 ${name}${extra ? ' (' + extra + ')' : ''}`); pass++; }
  else    { console.log(`  \u2717 ${name}${extra ? ' (' + extra + ')' : ''}`); fail++; }
};

(async () => {
  try {
    // Пересоздаём БД из schema.sql + накатываем seed (в коде, чтобы быть полностью в одном процессе)
    console.log('\n--- Сброс БД и seed ---');
    const fs = require('fs');
    const path = require('path');
    const schema = fs.readFileSync(path.join(__dirname, 'sql/schema.sql'), 'utf8');
    await pool.query(schema);

    // Seed inline (короче чем require seed.js, который вызывает pool.end())
    const empRows = await Promise.all([
      bcrypt.hash('Admin123', 10),
      bcrypt.hash('User123', 10),
      bcrypt.hash('User123', 10),
    ]);
    await pool.query(
      `INSERT INTO employees (username, password_hash, full_name, role) VALUES
       ('admin',  $1, 'Иванов И.И.',  'admin'),
       ('sklad1', $2, 'Петров П.П.',  'user'),
       ('sklad2', $3, 'Сидорова А.С.','user')`,
      empRows
    );
    const materials = [
      ['Цемент М500', 'кг', 500, 300],
      ['Арматура А500С 12мм', 'т', 2, 5],
      ['Кирпич рядовой М150', 'шт', 1000, 500],
      ['Пеноблок 600x300x200', 'шт', 200, 350],
      ['Песок строительный', 'м³', 5, 12],
      ['Щебень фракция 20-40', 'м³', 3, 8],
      ['Доска обрезная 50x150', 'п.м.', 100, 200],
    ];
    for (const [name, unit, minq, init] of materials) {
      const r = await pool.query(
        'INSERT INTO materials (name, unit, min_quantity) VALUES ($1,$2,$3) RETURNING id',
        [name, unit, minq]
      );
      await pool.query('UPDATE stock SET quantity = $1 WHERE material_id = $2', [init, r.rows[0].id]);
    }
    // Несколько операций
    await pool.query(
      `INSERT INTO transactions (material_id, employee_id, type, quantity, comment, created_at) VALUES
       (1, 1, 'income',  1000, 'Поставка', NOW() - INTERVAL '10 days'),
       (1, 2, 'expense',  700, 'Объект',   NOW() - INTERVAL '7 days'),
       (2, 1, 'income',     8, 'Договор',  NOW() - INTERVAL '6 days')`
    );
    console.log('  seed: 3 emp, 7 mat, 3 tx');

    console.log('\n═══════════ 12 ТЕСТ-КЕЙСОВ ИЗ ДИПЛОМА (таблица 3.4) ═══════════');

    // T1: вход
    console.log('\nТест 1: Корректный вход');
    let res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'Admin123' });
    t('HTTP 200', res.status === 200, `got ${res.status}`);
    t('JWT в ответе', !!res.body.token);
    t('Роль admin', res.body.role === 'admin', res.body.role);
    const adminToken = res.body.token;

    // T2: неверный пароль
    console.log('\nТест 2: Неверный пароль');
    res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'WRONG' });
    t('HTTP 401', res.status === 401);
    t('Сообщение «Неверный пароль»', res.body.error === 'Неверный пароль', res.body.error);

    // T3: несуществующий
    console.log('\nТест 3: Несуществующий логин');
    res = await request(app).post('/api/auth/login').send({ username: 'nobody', password: 'x' });
    t('HTTP 401', res.status === 401);
    t('Сообщение «Пользователь не найден»', res.body.error === 'Пользователь не найден', res.body.error);

    // T4: GET /stock с подсветкой
    console.log('\nТест 4: GET /api/stock');
    res = await request(app).get('/api/stock').set('Authorization', `Bearer ${adminToken}`);
    t('HTTP 200', res.status === 200);
    t('Возвращён массив', Array.isArray(res.body));
    const deficits = res.body.filter(r => r.is_deficit);
    t(`Дефицитов = 2 (цемент, кирпич)`, deficits.length === 2, `got ${deficits.length}`);
    t('Поле is_deficit присутствует', 'is_deficit' in res.body[0]);
    t('Поле min_quantity присутствует', 'min_quantity' in res.body[0]);
    t('Дефицитные идут первыми (сортировка)', res.body[0].is_deficit === true);

    const cement = res.body.find(r => r.name === 'Цемент М500');
    const cemId = cement.material_id;
    const cemBefore = Number(cement.quantity);

    // T5: приход
    console.log('\nТест 5: Приход +50');
    res = await request(app).post('/api/transactions/income')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ material_id: cemId, quantity: 50, comment: 'Тест 5' });
    t('HTTP 200', res.status === 200);
    t('success=true', res.body.success === true);
    t(`Новый остаток = ${cemBefore + 50}`, Number(res.body.new_quantity) === cemBefore + 50);

    // T6: расход
    console.log('\nТест 6: Расход -20');
    res = await request(app).post('/api/transactions/expense')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ material_id: cemId, quantity: 20, comment: 'Тест 6' });
    t('HTTP 200', res.status === 200);
    t(`Новый остаток = ${cemBefore + 50 - 20}`, Number(res.body.new_quantity) === cemBefore + 50 - 20);

    // T7: КРИТИЧЕСКИЙ — расход с нехваткой
    console.log('\nТест 7: КРИТИЧЕСКИЙ — расход 999999 (нехватка)');
    res = await request(app).post('/api/transactions/expense')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ material_id: cemId, quantity: 999999 });
    t('HTTP 400', res.status === 400, `got ${res.status}`);
    t('Сообщение «Недостаточно...»', res.body.error === 'Недостаточно материала на складе', res.body.error);

    // Проверяем что ROLLBACK сработал — остаток не изменился
    res = await request(app).get('/api/stock').set('Authorization', `Bearer ${adminToken}`);
    const cemNow = Number(res.body.find(r => r.name === 'Цемент М500').quantity);
    t(`ROLLBACK: остаток = ${cemBefore + 50 - 20} (не изменился)`, cemNow === cemBefore + 50 - 20, `got ${cemNow}`);

    // T8: без токена
    console.log('\nТест 8: /api/stock без токена');
    res = await request(app).get('/api/stock');
    t('HTTP 401', res.status === 401);

    // T9: разграничение ролей
    console.log('\nТест 9: Кладовщик пытается DELETE /api/employees');
    res = await request(app).post('/api/auth/login').send({ username: 'sklad1', password: 'User123' });
    const userToken = res.body.token;
    t('Кладовщик вошёл', !!userToken);
    res = await request(app).delete('/api/employees/2').set('Authorization', `Bearer ${userToken}`);
    t('HTTP 403 для кладовщика', res.status === 403, `got ${res.status}`);

    // T10: фильтры журнала
    console.log('\nТест 10: Журнал с фильтрами');
    res = await request(app).get('/api/transactions?type=income').set('Authorization', `Bearer ${adminToken}`);
    const allIncome = res.body.every(r => r.type === 'income');
    t(`type=income: все ${res.body.length} записей — income`, allIncome);

    const today = new Date().toISOString().slice(0, 10);
    res = await request(app).get(`/api/transactions?date_from=${today}`).set('Authorization', `Bearer ${adminToken}`);
    t(`date_from=сегодня: возвращены ${res.body.length} записей`, res.status === 200);

    res = await request(app).get(`/api/transactions?type=income&material_id=${cemId}`).set('Authorization', `Bearer ${adminToken}`);
    const allCemIncome = res.body.every(r => r.material_name === 'Цемент М500' && r.type === 'income');
    t(`type+material_id: ${res.body.length} записей соответствуют`, allCemIncome);

    // Проверка JOIN — должны быть material_name, unit, employee_full_name, comment
    res = await request(app).get('/api/transactions').set('Authorization', `Bearer ${adminToken}`);
    const sample = res.body[0];
    t('JSON содержит material_name', 'material_name' in sample);
    t('JSON содержит unit', 'unit' in sample);
    t('JSON содержит employee_full_name', 'employee_full_name' in sample);
    t('JSON содержит comment', 'comment' in sample);

    // T11: добавление материала
    console.log('\nТест 11: POST /api/materials (admin)');
    res = await request(app).post('/api/materials')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Краска фасадная белая', unit: 'л', min_quantity: 20 });
    t('HTTP 201', res.status === 201, `got ${res.status}`);
    const newMatId = res.body.id;
    t('id присвоен', !!newMatId);

    // Триггер: stock=0
    res = await request(app).get('/api/stock').set('Authorization', `Bearer ${adminToken}`);
    const paint = res.body.find(r => r.name === 'Краска фасадная белая');
    t('Триггер создал stock с qty=0', Number(paint.quantity) === 0);
    t('is_deficit=true для нового материала (qty<min)', paint.is_deficit === true);

    // T12: битый JWT
    console.log('\nТест 12: Битый JWT');
    res = await request(app).get('/api/stock').set('Authorization', 'Bearer invalid.token.here');
    t('HTTP 401', res.status === 401);

    // Дополнительные проверки (нефункциональные требования)
    console.log('\n═══════════ ДОП. ПРОВЕРКИ ═══════════');

    // CHECK constraint
    console.log('\nДоп: БД CHECK (quantity >= 0)');
    try {
      await pool.query(`UPDATE stock SET quantity = -10 WHERE material_id = ${cemId}`);
      t('CHECK сработал', false, 'не отклонил отрицательный остаток!');
    } catch (e) {
      t('CHECK сработал', e.code === '23514', e.code);
    }

    // Нельзя удалить себя
    console.log('\nДоп: admin удаляет сам себя');
    res = await request(app).delete('/api/employees/1').set('Authorization', `Bearer ${adminToken}`);
    t('HTTP 400', res.status === 400);
    t('Сообщение про себя', /собственн|сам/i.test(res.body.error), res.body.error);

    // Нельзя удалить материал с историей
    console.log('\nДоп: DELETE материал с операциями');
    res = await request(app).delete(`/api/materials/${cemId}`).set('Authorization', `Bearer ${adminToken}`);
    t('HTTP 409', res.status === 409);
    t('Сообщение «нельзя удалить»', /нельзя удалить/i.test(res.body.error), res.body.error);

    // Можно удалить материал БЕЗ операций
    console.log('\nДоп: DELETE материал без истории');
    res = await request(app).delete(`/api/materials/${newMatId}`).set('Authorization', `Bearer ${adminToken}`);
    t('HTTP 200', res.status === 200);

    // CRUD сотрудников
    console.log('\nДоп: POST /api/employees (создание)');
    res = await request(app).post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'newkeeper', password: 'Secret123', full_name: 'Новый Кладовщик', role: 'user' });
    t('HTTP 201', res.status === 201);
    t('password_hash НЕ возвращён в ответе', !('password_hash' in res.body));

    // Дубликат логина (валидный пароль, чтобы дойти до проверки уникальности)
    res = await request(app).post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'newkeeper', password: 'Secret456', full_name: 'X', role: 'user' });
    t('HTTP 409 на дубликат', res.status === 409, `got ${res.status}: ${res.body.error}`);

    // GET сотрудников без password_hash
    res = await request(app).get('/api/employees').set('Authorization', `Bearer ${adminToken}`);
    const noHashes = res.body.every(u => !('password_hash' in u));
    t('Список сотрудников БЕЗ password_hash', noHashes);

    // 8 часов JWT?
    console.log('\nДоп: проверка срока JWT');
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(adminToken);
    const lifetime = decoded.exp - decoded.iat;
    t(`JWT срок = 8h (${lifetime}s)`, lifetime === 8 * 3600, `${lifetime}s`);

    // bcrypt work factor = 10
    console.log('\nДоп: bcrypt work factor');
    const empRow = await pool.query("SELECT password_hash FROM employees WHERE username='admin'");
    const wf = empRow.rows[0].password_hash.match(/^\$2[aby]\$(\d+)\$/);
    t(`bcrypt work factor = 10`, wf && wf[1] === '10', wf ? wf[1] : 'not bcrypt');

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`ИТОГО: ${pass} пройдено, ${fail} провалено`);
    console.log('═══════════════════════════════════════════════════');

    await pool.end();
    process.exit(fail === 0 ? 0 : 1);
  } catch (err) {
    console.error('\nFATAL:', err);
    await pool.end();
    process.exit(1);
  }
})();
