import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/database.js';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../config.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Укажите логин и пароль' });
  }

  try {
    const { rows } = await pool.query(`SELECT * FROM employees WHERE username = $1`, [
      String(username).trim(),
    ]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      algorithm: 'HS256',
    });

    return res.json({
      token,
      role: user.role,
      full_name: user.full_name,
    });
  } catch (e) {
    console.error('[auth/login]', e);
    return res.status(500).json({ error: 'Ошибка авторизации' });
  }
});

export default router;
