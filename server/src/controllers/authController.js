/**
 * Авторизация: выдача JWT после проверки логина и пароля.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../config.js';
import { getDb } from '../db/database.js';

export function login(req, res) {
  const { login: username, password } = req.body ?? {};

  if (!username || !password || typeof username !== 'string') {
    return res.status(400).json({ message: 'Укажите логин и пароль' });
  }

  const db = getDb();
  const user = db.prepare('SELECT id, login, password_hash, role FROM employees WHERE login = ?').get(username.trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
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
}
