// 2.6 GET /api/stock — остатки с индикацией дефицита (ФТ-3)
const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.id            AS material_id,
        m.name          AS name,
        m.unit          AS unit,
        s.quantity      AS quantity,
        m.min_quantity  AS min_quantity,
        (s.quantity < m.min_quantity) AS is_deficit
      FROM materials m
      JOIN stock s ON s.material_id = m.id
      ORDER BY (s.quantity < m.min_quantity) DESC, m.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('[GET /api/stock]', err);
    res.status(500).json({ error: 'Ошибка получения остатков' });
  }
});

module.exports = router;
