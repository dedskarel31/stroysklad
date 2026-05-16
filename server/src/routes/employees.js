import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = Router();

router.get('/', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, full_name, role, created_at
       FROM employees
       ORDER BY username`,
    );
    res.json(rows);
  } catch (e) {
    console.error('[employees GET]', e);
    res.status(500).json({ error: 'Не удалось получить сотрудников' });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  const { username, password, full_name, role } = req.body ?? {};

  if (!username?.trim() || !password || !full_name?.trim()) {
    return res.status(400).json({ error: 'Логин, пароль и ФИО обязательны' });
  }
  if (role !== 'admin' && role !== 'user') {
    return res.status(400).json({ error: 'Роль должна быть admin или user' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Пароль: минимум 6 символов' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO employees (username, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, full_name, role`,
      [username.trim(), password_hash, full_name.trim(), role],
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Такой логин уже занят' });
    }
    console.error('[employees POST]', e);
    res.status(500).json({ error: 'Не удалось создать сотрудника' });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Некорректный id' });
  }
  if (req.user.id === id) {
    return res.status(400).json({ error: 'Нельзя удалить самого себя' });
  }

  try {
    const { rowCount } = await pool.query(`DELETE FROM employees WHERE id = $1`, [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('[employees DELETE]', e);
    res.status(500).json({ error: 'Не удалось удалить сотрудника' });
  }
});

export default router;
