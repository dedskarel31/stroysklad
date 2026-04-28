/**
 * Остатки на складе с присоединением справочника материалов.
 */
import { getDb } from '../db/database.js';

export function listStock(_req, res) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
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
    ORDER BY m.name
  `).all();
  res.json(rows);
}
