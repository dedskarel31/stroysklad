/**
 * Остатки на складе с присоединением справочника материалов.
 */
import { pool } from '../db/database.js';

export async function listStock(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT
         sb.id AS balance_id,
         sb.material_id,
         m.name,
         m.article,
         m.unit,
         m.min_quantity,
         sb.quantity,
         sb.last_updated
       FROM stock_balances sb
       INNER JOIN materials m ON m.id = sb.material_id
       ORDER BY m.name`,
    );
    res.json(rows);
  } catch (error) {
    console.error('[stock]', error);
    res.status(500).json({ message: 'Не удалось получить остатки' });
  }
}
