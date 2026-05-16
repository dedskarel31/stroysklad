// CRUD материалов (соответствует ФТ-9 диплома)
const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// 2.2 GET /api/materials — список (любой авторизованный)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, unit, min_quantity FROM materials ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[GET /api/materials]', err);
    res.status(500).json({ error: 'Ошибка получения списка материалов' });
  }
});

// 2.3 POST /api/materials — создать (только admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, unit, min_quantity } = req.body || {};

  if (!name || !unit) {
    return res.status(400).json({ error: 'Поля name и unit обязательны' });
  }
  const minQ = Number(min_quantity);
  if (Number.isNaN(minQ) || minQ < 0) {
    return res.status(400).json({ error: 'min_quantity должен быть неотрицательным числом' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO materials (name, unit, min_quantity)
       VALUES ($1, $2, $3) RETURNING id, name, unit, min_quantity`,
      [name.trim(), unit.trim(), minQ]
    );
    // Триггер автоматически создал строку в stock с quantity=0
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Материал с таким наименованием уже существует' });
    }
    console.error('[POST /api/materials]', err);
    res.status(500).json({ error: 'Ошибка создания материала' });
  }
});

// 2.4 PUT /api/materials/:id — обновить
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const { name, unit, min_quantity } = req.body || {};

  if (!name || !unit) {
    return res.status(400).json({ error: 'Поля name и unit обязательны' });
  }
  const minQ = Number(min_quantity);
  if (Number.isNaN(minQ) || minQ < 0) {
    return res.status(400).json({ error: 'min_quantity должен быть неотрицательным числом' });
  }

  try {
    const result = await pool.query(
      `UPDATE materials SET name = $1, unit = $2, min_quantity = $3
       WHERE id = $4 RETURNING id, name, unit, min_quantity`,
      [name.trim(), unit.trim(), minQ, id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Материал не найден' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Материал с таким наименованием уже существует' });
    }
    console.error('[PUT /api/materials/:id]', err);
    res.status(500).json({ error: 'Ошибка обновления материала' });
  }
});

// 2.5 DELETE /api/materials/:id — удалить (проверка истории)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const tx = await pool.query(
      'SELECT 1 FROM transactions WHERE material_id = $1 LIMIT 1',
      [id]
    );
    if (tx.rows.length) {
      return res.status(409).json({
        error: 'Нельзя удалить материал с историей операций',
      });
    }
    const result = await pool.query(
      'DELETE FROM materials WHERE id = $1 RETURNING id',
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Материал не найден' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/materials/:id]', err);
    res.status(500).json({ error: 'Ошибка удаления материала' });
  }
});

module.exports = router;
