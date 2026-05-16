import { Router } from 'express';
import { pool } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const INSUFFICIENT = 'Недостаточно материала на складе';

async function incomeHandler(req, res) {
  const material_id = Number(req.body?.material_id);
  const quantity = Number(req.body?.quantity);
  const comment = req.body?.comment?.trim() || null;
  const employee_id = req.user.id;

  if (!Number.isInteger(material_id) || material_id < 1) {
    return res.status(400).json({ error: 'Укажите корректный material_id' });
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Количество должно быть больше 0' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const mat = await client.query(`SELECT id FROM materials WHERE id = $1`, [material_id]);
    if (mat.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Материал не найден' });
    }

    const { rows: stockRows } = await client.query(
      `UPDATE stock SET quantity = quantity + $1 WHERE material_id = $2 RETURNING quantity`,
      [quantity, material_id],
    );

    if (stockRows.length === 0) {
      await client.query(
        `INSERT INTO stock (material_id, quantity) VALUES ($1, $2)`,
        [material_id, quantity],
      );
    }

    await client.query(
      `INSERT INTO transactions (material_id, employee_id, type, quantity, comment)
       VALUES ($1, $2, 'income', $3, $4)`,
      [material_id, employee_id, quantity, comment],
    );

    const { rows: final } = await client.query(
      `SELECT quantity FROM stock WHERE material_id = $1`,
      [material_id],
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, new_quantity: Number(final[0].quantity) });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[transactions/income]', e);
    res.status(500).json({ error: 'Не удалось выполнить приход' });
  } finally {
    client.release();
  }
}

async function expenseHandler(req, res) {
  const material_id = Number(req.body?.material_id);
  const quantity = Number(req.body?.quantity);
  const comment = req.body?.comment?.trim() || null;
  const employee_id = req.user.id;

  if (!Number.isInteger(material_id) || material_id < 1) {
    return res.status(400).json({ error: 'Укажите корректный material_id' });
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Количество должно быть больше 0' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: locked } = await client.query(
      `SELECT quantity FROM stock WHERE material_id = $1 FOR UPDATE`,
      [material_id],
    );

    if (locked.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: INSUFFICIENT });
    }

    const current = Number(locked[0].quantity);
    if (current < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: INSUFFICIENT });
    }

    await client.query(`UPDATE stock SET quantity = quantity - $1 WHERE material_id = $2`, [
      quantity,
      material_id,
    ]);

    await client.query(
      `INSERT INTO transactions (material_id, employee_id, type, quantity, comment)
       VALUES ($1, $2, 'expense', $3, $4)`,
      [material_id, employee_id, quantity, comment],
    );

    const newQty = current - quantity;
    await client.query('COMMIT');
    res.status(201).json({ success: true, new_quantity: newQty });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[transactions/expense]', e);
    res.status(500).json({ error: 'Не удалось выполнить расход' });
  } finally {
    client.release();
  }
}

router.post('/income', authMiddleware, incomeHandler);
router.post('/expense', authMiddleware, expenseHandler);

router.get('/', authMiddleware, async (req, res) => {
  const { type, date_from, date_to, material_id: materialIdRaw } = req.query;
  const conditions = [];
  const params = [];

  if (type === 'income' || type === 'expense') {
    params.push(type);
    conditions.push(`t.type = $${params.length}`);
  }
  if (date_from) {
    params.push(date_from);
    conditions.push(`t.created_at::date >= $${params.length}::date`);
  }
  if (date_to) {
    params.push(date_to);
    conditions.push(`t.created_at::date <= $${params.length}::date`);
  }
  if (materialIdRaw !== undefined && materialIdRaw !== '') {
    const mid = Number(materialIdRaw);
    if (Number.isInteger(mid) && mid > 0) {
      params.push(mid);
      conditions.push(`t.material_id = $${params.length}`);
    }
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT
         t.id,
         t.type,
         t.quantity,
         t.comment,
         t.created_at,
         m.name AS material_name,
         m.unit,
         e.full_name AS employee_full_name
       FROM transactions t
       INNER JOIN materials m ON m.id = t.material_id
       INNER JOIN employees e ON e.id = t.employee_id
       ${where}
       ORDER BY t.created_at DESC`,
      params,
    );
    res.json(rows);
  } catch (e) {
    console.error('[transactions GET]', e);
    res.status(500).json({ error: 'Не удалось получить журнал операций' });
  }
});

export default router;
