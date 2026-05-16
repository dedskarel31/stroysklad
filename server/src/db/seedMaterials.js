import { MATERIALS_CATALOG } from '../data/materialsCatalog.js';
import { pool } from './database.js';

/** Добавляет/обновляет материалы из справочника при старте сервера. */
export async function ensureMaterialsCatalog() {
  for (const item of MATERIALS_CATALOG) {
    const { rows } = await pool.query(
      `INSERT INTO materials (name, article, unit, min_quantity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (article) DO UPDATE SET
         name = EXCLUDED.name,
         unit = EXCLUDED.unit,
         min_quantity = EXCLUDED.min_quantity
       RETURNING id`,
      [item.name, item.article, item.unit, item.min_quantity],
    );

    const materialId = rows[0].id;
    await pool.query(
      `INSERT INTO stock_balances (material_id, quantity, last_updated)
       VALUES ($1, 0, NOW())
       ON CONFLICT (material_id) DO NOTHING`,
      [materialId],
    );
  }
}
