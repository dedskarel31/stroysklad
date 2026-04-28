/**
 * Валидация складских ограничений (ЛР №8): перед расходом проверяем остаток.
 */

/** Текст ошибки — как в техническом задании */
export const INSUFFICIENT_STOCK_MESSAGE = 'Недостаточно материала на складе';

/**
 * Текущий остаток по материалу (если строки нет — 0).
 */
export async function getCurrentStockQuantity(client, materialId) {
  const { rows } = await client.query('SELECT quantity FROM stock_balances WHERE material_id = $1', [materialId]);
  const row = rows[0];
  return row ? Number(row.quantity) : 0;
}

/**
 * Можно ли списать quantity единиц (расход допустим только если остаток ≥ quantity).
 */
export async function canExpense(client, materialId, quantity) {
  const current = await getCurrentStockQuantity(client, materialId);
  return quantity <= current;
}
