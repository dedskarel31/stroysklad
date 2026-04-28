/**
 * Приход / расход: вызов бизнес-логики с проверкой остатка (расход).
 */
import { createOperation } from '../services/operationService.js';

export function createOperationHttp(req, res) {
  const { type, material_id: materialIdRaw, quantity: qtyRaw, date } = req.body ?? {};

  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ message: 'Тип операции должен быть income или expense' });
  }

  const material_id = Number(materialIdRaw);
  const quantity = Number(qtyRaw);

  if (!Number.isInteger(material_id) || material_id < 1) {
    return res.status(400).json({ message: 'Укажите корректный material_id' });
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return res.status(400).json({ message: 'Количество должно быть положительным числом' });
  }

  try {
    const result = createOperation({
      type,
      material_id,
      quantity,
      date: date ?? null,
    });

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    return res.status(201).json({ id: result.id });
  } catch (e) {
    console.error('[operation]', e);
    return res.status(500).json({ message: 'Не удалось сохранить операцию' });
  }
}
