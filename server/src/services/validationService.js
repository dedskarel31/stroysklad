/**
 * Валидация складских ограничений (ЛР №8): перед расходом проверяем остаток.
 */

/** Текст ошибки — как в техническом задании */
export const INSUFFICIENT_STOCK_MESSAGE = 'Недостаточно материала на складе';

/**
 * Текущий остаток по материалу (если строки нет — 0).
 */
export function getCurrentStockQuantity(db, materialId) {
  const row = db.prepare('SELECT quantity FROM stock_balances WHERE material_id = ?').get(materialId);
  return row ? Number(row.quantity) : 0;
}

/**
 * Можно ли списать quantity единиц (расход допустим только если остаток ≥ quantity).
 */
export function canExpense(db, materialId, quantity) {
  const current = getCurrentStockQuantity(db, materialId);
  return quantity <= current;
}
