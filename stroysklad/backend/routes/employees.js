// CRUD сотрудников (ФТ-10 диплома)
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// 2.10 GET /api/employees — список (без password_hash!)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, full_name, role, created_at
       FROM employees ORDER BY id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[GET /api/employees]', err);
    res.status(500).json({ error: 'Ошибка получения списка сотрудников' });
  }
});

// 2.11 POST /api/employees — создать
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  const { username, password, full_name, role } = req.body || {};

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Поля username, password и role обязательны' });
  }
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Роль должна быть admin или user' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO employees (username, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, full_name, role, created_at`,
      [username.trim(), hash, full_name?.trim() || null, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Пользователь с таким логином уже существует' });
    }
    console.error('[POST /api/employees]', err);
    res.status(500).json({ error: 'Ошибка создания сотрудника' });
  }
});

// 2.12 DELETE /api/employees/:id — удалить (нельзя самого себя)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const id = Number(req.params.id);

  if (id === req.user.id) {
    return res.status(400).json({ error: 'Нельзя удалить собственную учётную запись' });
  }

  try {
    // Проверка: есть ли операции этого сотрудника
    const tx = await pool.query(
      'SELECT 1 FROM transactions WHERE employee_id = $1 LIMIT 1',
      [id]
    );
    if (tx.rows.length) {
      return res.status(409).json({
        error: 'Нельзя удалить сотрудника с историей операций',
      });
    }

    const result = await pool.query(
      'DELETE FROM employees WHERE id = $1 RETURNING id',
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/employees/:id]', err);
    res.status(500).json({ error: 'Ошибка удаления сотрудника' });
  }
});

module.exports = router;
