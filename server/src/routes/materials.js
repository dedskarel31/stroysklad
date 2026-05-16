import { Router } from 'express';
import { pool } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = Router();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, unit, min_quantity FROM materials ORDER BY name`,
    );
    res.json(rows);
  } catch (e) {
    console.error('[materials GET]', e);
    res.status(500).json({ error: 'Не удалось получить материалы' });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, unit, min_quantity: minRaw } = req.body ?? {};
  const min_quantity = minRaw !== undefined ? Number(minRaw) : 0;

  if (!name?.trim() || !unit?.trim()) {
    return res.status(400).json({ error: 'Название и единица измерения обязательны' });
  }
  if (!Number.isFinite(min_quantity) || min_quantity < 0) {
    return res.status(400).json({ error: 'Минимальный остаток должен быть >= 0' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO materials (name, unit, min_quantity)
       VALUES ($1, $2, $3)
       RETURNING id, name, unit, min_quantity`,
      [name.trim(), unit.trim(), min_quantity],
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Материал с таким названием уже существует' });
    }
    console.error('[materials POST]', e);
    res.status(500).json({ error: 'Не удалось создать материал' });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const { name, unit, min_quantity: minRaw } = req.body ?? {};
  const min_quantity = minRaw !== undefined ? Number(minRaw) : undefined;

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Некорректный id' });
  }
  if (!name?.trim() || !unit?.trim()) {
    return res.status(400).json({ error: 'Название и единица измерения обязательны' });
  }
  if (min_quantity !== undefined && (!Number.isFinite(min_quantity) || min_quantity < 0)) {
    return res.status(400).json({ error: 'Минимальный остаток должен быть >= 0' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE materials SET name = $1, unit = $2, min_quantity = COALESCE($3, min_quantity)
       WHERE id = $4
       RETURNING id, name, unit, min_quantity`,
      [name.trim(), unit.trim(), min_quantity, id],
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Материал не найден' });
    }
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Материал с таким названием уже существует' });
    }
    console.error('[materials PUT]', e);
    res.status(500).json({ error: 'Не удалось обновить материал' });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Некорректный id' });
  }

  try {
    const { rows: tx } = await pool.query(
      `SELECT 1 FROM transactions WHERE material_id = $1 LIMIT 1`,
      [id],
    );
    if (tx.length > 0) {
      return res.status(409).json({ error: 'Нельзя удалить материал с историей операций' });
    }

    const { rowCount } = await pool.query(`DELETE FROM materials WHERE id = $1`, [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Материал не найден' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('[materials DELETE]', e);
    res.status(500).json({ error: 'Не удалось удалить материал' });
  }
});

export default router;
