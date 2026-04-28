/**
 * Справочник материалов (для форм выбора и отчётов).
 */
import { pool } from '../db/database.js';

export async function listMaterials(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, article, unit, min_quantity
       FROM materials
       ORDER BY name`,
    );
    res.json(rows);
  } catch (error) {
    console.error('[materials]', error);
    res.status(500).json({ message: 'Не удалось получить список материалов' });
  }
}
