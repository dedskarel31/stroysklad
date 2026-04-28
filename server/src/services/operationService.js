/**
 * Создание операции прихода/расхода с обновлением остатков в одной транзакции.
 */
import { getDb } from '../db/database.js';
import {
  canExpense,
  getCurrentStockQuantity,
  INSUFFICIENT_STOCK_MESSAGE,
} from './validationService.js';

/**
 * @param {{ type: 'income' | 'expense', material_id: number, quantity: number, date?: string | null }} payload
 * @returns {{ ok: true, id: number } | { ok: false, status: number, message: string }}
 */
export function createOperation(payload) {
  const { type, material_id, quantity, date } = payload;
  const db = getDb();

  const material = db.prepare('SELECT id FROM materials WHERE id = ?').get(material_id);
  if (!material) {
    return { ok: false, status: 404, message: 'Материал не найден' };
  }

  if (type === 'expense' && !canExpense(db, material_id, quantity)) {
    return { ok: false, status: 400, message: INSUFFICIENT_STOCK_MESSAGE };
  }

  db.exec('BEGIN IMMEDIATE');
  try {
    // Повторная проверка под блокировкой транзакции (на случай гонок)
    if (type === 'expense' && !canExpense(db, material_id, quantity)) {
      db.exec('ROLLBACK');
      return { ok: false, status: 400, message: INSUFFICIENT_STOCK_MESSAGE };
    }

    const opDate = date && String(date).trim() ? String(date).trim() : null;
    const insertOp = db.prepare(`
      INSERT INTO operations (type, material_id, quantity, date)
      VALUES (?, ?, ?, COALESCE(?, datetime('now')))
    `);
    const opResult = insertOp.run(type, material_id, quantity, opDate);
    const newId = Number(opResult.lastInsertRowid);

    if (type === 'income') {
      upsertStockAfterIncome(db, material_id, quantity);
    } else {
      applyExpenseToStock(db, material_id, quantity);
    }

    db.exec('COMMIT');
    return { ok: true, id: newId };
  } catch (e) {
    try {
      db.exec('ROLLBACK');
    } catch {
      /* уже откатили или соединение в неверном состоянии */
    }
    throw e;
  }
}

/**
 * Увеличивает остаток при приходе; при отсутствии строки остатка — вставляет новую.
 */
function upsertStockAfterIncome(db, materialId, delta) {
  const row = db.prepare('SELECT id, quantity FROM stock_balances WHERE material_id = ?').get(materialId);
  if (row) {
    const next = Number(row.quantity) + Number(delta);
    db.prepare(`UPDATE stock_balances SET quantity = ?, last_updated = datetime('now') WHERE material_id = ?`).run(
      next,
      materialId,
    );
  } else {
    db.prepare(`INSERT INTO stock_balances (material_id, quantity, last_updated) VALUES (?, ?, datetime('now'))`).run(
      materialId,
      delta,
    );
  }
}

/**
 * Уменьшает остаток при расходе (строка остатка должна существовать после проверки canExpense).
 */
function applyExpenseToStock(db, materialId, delta) {
  const current = getCurrentStockQuantity(db, materialId);
  const next = current - Number(delta);
  db.prepare(`UPDATE stock_balances SET quantity = ?, last_updated = datetime('now') WHERE material_id = ?`).run(
    next,
    materialId,
  );
}
