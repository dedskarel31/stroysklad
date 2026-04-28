/**
 * Справочник материалов (для форм выбора и отчётов).
 */
import { getDb } from '../db/database.js';

export function listMaterials(_req, res) {
  const db = getDb();
  const rows = db.prepare('SELECT id, name, article, unit, min_quantity FROM materials ORDER BY name').all();
  res.json(rows);
}
