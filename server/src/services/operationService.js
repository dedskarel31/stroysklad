/**
 * Создание операции прихода/расхода с обновлением остатков в одной транзакции.
 */
import { pool } from '../db/database.js';
import {
  canExpense,
  getCurrentStockQuantity,
  INSUFFICIENT_STOCK_MESSAGE,
} from './validationService.js';

/**
 * @param {{ type: 'income' | 'expense', material_id: number, quantity: number, date?: string | null }} payload
 * @returns {{ ok: true, id: number } | { ok: false, status: number, message: string }}
 */
export async function createOperation(payload) {
  const { type, material_id, quantity, date } = payload;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: materialRows } = await client.query('SELECT id FROM materials WHERE id = $1', [material_id]);
    if (materialRows.length === 0) {
      await client.query('ROLLBACK');
      return { ok: false, status: 404, message: 'Материал не найден' };
    }

    // Критичная проверка расхода выполняется внутри транзакции.
    if (type === 'expense' && !(await canExpense(client, material_id, quantity))) {
      await client.query('ROLLBACK');
      return { ok: false, status: 400, message: INSUFFICIENT_STOCK_MESSAGE };
    }

    const opDate = date && String(date).trim() ? String(date).trim() : null;
    const { rows: operationRows } = await client.query(
      `INSERT INTO operations (type, material_id, quantity, date)
       VALUES ($1, $2, $3, COALESCE($4, NOW()))
       RETURNING id`,
      [type, material_id, quantity, opDate],
    );
    const newId = Number(operationRows[0].id);

    if (type === 'income') {
      await upsertStockAfterIncome(client, material_id, quantity);
    } else {
      await applyExpenseToStock(client, material_id, quantity);
    }

    await client.query('COMMIT');
    return { ok: true, id: newId };
  } catch (e) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* уже откатили или соединение в неверном состоянии */
    }
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Увеличивает остаток при приходе; при отсутствии строки остатка — вставляет новую.
 */
async function upsertStockAfterIncome(client, materialId, delta) {
  const { rows } = await client.query('SELECT id, quantity FROM stock_balances WHERE material_id = $1', [materialId]);
  const row = rows[0];
  if (row) {
    const next = Number(row.quantity) + Number(delta);
    await client.query(
      `UPDATE stock_balances
       SET quantity = $1, last_updated = NOW()
       WHERE material_id = $2`,
      [next, materialId],
    );
  } else {
    await client.query(
      `INSERT INTO stock_balances (material_id, quantity, last_updated)
       VALUES ($1, $2, NOW())`,
      [materialId, delta],
    );
  }
}

/**
 * Уменьшает остаток при расходе (строка остатка должна существовать после проверки canExpense).
 */
async function applyExpenseToStock(client, materialId, delta) {
  const current = await getCurrentStockQuantity(client, materialId);
  const next = current - Number(delta);
  await client.query(
    `UPDATE stock_balances
     SET quantity = $1, last_updated = NOW()
     WHERE material_id = $2`,
    [next, materialId],
  );
}
