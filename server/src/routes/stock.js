import { Router } from 'express';
import { pool } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         s.material_id,
         m.name,
         m.unit,
         s.quantity,
         m.min_quantity,
         (s.quantity < m.min_quantity) AS is_deficit
       FROM stock s
       INNER JOIN materials m ON m.id = s.material_id
       ORDER BY is_deficit DESC, m.name ASC`,
    );
    res.json(
      rows.map((r) => ({
        ...r,
        is_deficit: Boolean(r.is_deficit),
      })),
    );
  } catch (e) {
    console.error('[stock GET]', e);
    res.status(500).json({ error: 'Не удалось получить остатки' });
  }
});

export default router;
