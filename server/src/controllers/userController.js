/**
 * Управление пользователями — только администратор.
 */
import { pool } from '../db/database.js';

export async function listUsers(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, login, role
       FROM employees
       ORDER BY login`,
    );
    res.json(rows);
  } catch (e) {
    console.error('[users list]', e);
    res.status(500).json({ message: 'Не удалось получить список пользователей' });
  }
}

export async function updateUserRole(req, res) {
  const userId = Number(req.params.id);
  const { role } = req.body ?? {};

  if (!Number.isInteger(userId) || userId < 1) {
    return res.status(400).json({ message: 'Некорректный id пользователя' });
  }

  if (role !== 'admin' && role !== 'storekeeper') {
    return res.status(400).json({ message: 'Роль должна быть admin или storekeeper' });
  }

  if (Number(req.user.sub) === userId && role !== 'admin') {
    return res.status(400).json({ message: 'Нельзя снять с себя роль администратора' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE employees
       SET role = $1
       WHERE id = $2
       RETURNING id, login, role`,
      [role, userId],
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json({ user: rows[0] });
  } catch (e) {
    console.error('[users role]', e);
    res.status(500).json({ message: 'Не удалось изменить роль' });
  }
}
