/**
 * Приход / расход и журнал операций.
 */
import { pool } from '../db/database.js';
import { createOperation } from '../services/operationService.js';

export async function createOperationHttp(req, res) {
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
    const result = await createOperation({
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

/** Журнал операций — отчёт о движении материалов. */
export async function listOperations(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT o.id,
              o.type,
              o.quantity,
              o.date,
              m.name AS material_name,
              m.unit,
              m.article
       FROM operations o
       INNER JOIN materials m ON m.id = o.material_id
       ORDER BY o.date DESC, o.id DESC
       LIMIT 500`,
    );
    res.json(rows);
  } catch (e) {
    console.error('[operations list]', e);
    res.status(500).json({ message: 'Не удалось получить журнал операций' });
  }
}
