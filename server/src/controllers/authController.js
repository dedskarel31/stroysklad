/**
 * Авторизация: выдача JWT после проверки логина и пароля.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../config.js';
import { pool } from '../db/database.js';

export async function login(req, res) {
  const { login: username, password } = req.body ?? {};

  if (!username || !password || typeof username !== 'string') {
    return res.status(400).json({ message: 'Укажите логин и пароль' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, login, password_hash, role
       FROM employees
       WHERE login = $1`,
      [username.trim()],
    );
    const user = rows[0];

    if (!user || !bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        login: user.login,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return res.json({
      token,
      user: {
        id: user.id,
        login: user.login,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[auth]', error);
    return res.status(500).json({ message: 'Ошибка авторизации' });
  }
}
