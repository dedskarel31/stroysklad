// Операции прихода/расхода и журнал
// Расходная операция реализована по листингу 3.3 диплома (SELECT FOR UPDATE)
const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Хелпер: валидация тела
function validateBody(body) {
  const material_id = Number(body?.material_id);
  const quantity = Number(body?.quantity);
  const comment = (body?.comment || '').toString().trim() || null;

  if (!Number.isFinite(material_id) || material_id <= 0) {
    return { error: 'Поле material_id обязательно' };
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: 'Количество должно быть положительным числом' };
  }
  return { material_id, quantity, comment };
}

// 2.7 POST /api/transactions/income — приход
router.post('/income', authMiddleware, async (req, res) => {
  const v = validateBody(req.body);
  if (v.error) return res.status(400).json({ error: v.error });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Проверка существования материала
    const mat = await client.query(
      'SELECT 1 FROM materials WHERE id = $1',
      [v.material_id]
    );
    if (!mat.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Материал не найден' });
    }

    const upd = await client.query(
      `UPDATE stock SET quantity = quantity + $1
       WHERE material_id = $2 RETURNING quantity`,
      [v.quantity, v.material_id]
    );

    await client.query(
      `INSERT INTO transactions (material_id, employee_id, type, quantity, comment)
       VALUES ($1, $2, 'income', $3, $4)`,
      [v.material_id, req.user.id, v.quantity, v.comment]
    );

    await client.query('COMMIT');
    res.json({ success: true, new_quantity: Number(upd.rows[0].quantity) });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[POST /api/transactions/income]', err);
    res.status(500).json({ error: 'Ошибка регистрации прихода' });
  } finally {
    client.release();
  }
});

// 2.8 POST /api/transactions/expense — расход (КРИТИЧНО: SELECT FOR UPDATE)
router.post('/expense', authMiddleware, async (req, res) => {
  const v = validateBody(req.body);
  if (v.error) return res.status(400).json({ error: v.error });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Блокировка строки остатка до конца транзакции — исключает гонку
    const stockRes = await client.query(
      'SELECT quantity FROM stock WHERE material_id = $1 FOR UPDATE',
      [v.material_id]
    );

    if (!stockRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Материал не найден' });
    }

    const current = parseFloat(stockRes.rows[0].quantity);
    if (current < v.quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Недостаточно материала на складе',
        available: current,
      });
    }

    const upd = await client.query(
      `UPDATE stock SET quantity = quantity - $1
       WHERE material_id = $2 RETURNING quantity`,
      [v.quantity, v.material_id]
    );

    await client.query(
      `INSERT INTO transactions (material_id, employee_id, type, quantity, comment)
       VALUES ($1, $2, 'expense', $3, $4)`,
      [v.material_id, req.user.id, v.quantity, v.comment]
    );

    await client.query('COMMIT');
    res.json({ success: true, new_quantity: Number(upd.rows[0].quantity) });
  } catch (err) {
    await client.query('ROLLBACK');
    // CHECK (quantity >= 0) сработает на уровне БД — дополнительный барьер
    if (err.code === '23514') {
      return res.status(400).json({ error: 'Недостаточно материала на складе' });
    }
    console.error('[POST /api/transactions/expense]', err);
    res.status(500).json({ error: 'Ошибка регистрации расхода' });
  } finally {
    client.release();
  }
});

// 2.9 GET /api/transactions — журнал с фильтрами
router.get('/', authMiddleware, async (req, res) => {
  const { type, date_from, date_to, material_id } = req.query;

  const conditions = [];
  const params = [];
  let i = 1;

  if (type === 'income' || type === 'expense') {
    conditions.push(`t.type = $${i++}`);
    params.push(type);
  }
  if (date_from) {
    conditions.push(`t.created_at >= $${i++}`);
    params.push(date_from);
  }
  if (date_to) {
    // включаем весь день
    conditions.push(`t.created_at < ($${i++}::date + INTERVAL '1 day')`);
    params.push(date_to);
  }
  if (material_id) {
    conditions.push(`t.material_id = $${i++}`);
    params.push(Number(material_id));
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT
         t.id,
         t.type,
         t.quantity,
         t.comment,
         t.created_at,
         m.name AS material_name,
         m.unit AS unit,
         COALESCE(e.full_name, e.username) AS employee_full_name
       FROM transactions t
       JOIN materials m ON m.id = t.material_id
       JOIN employees e ON e.id = t.employee_id
       ${where}
       ORDER BY t.created_at DESC
       LIMIT 1000`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[GET /api/transactions]', err);
    res.status(500).json({ error: 'Ошибка получения журнала операций' });
  }
});

module.exports = router;
