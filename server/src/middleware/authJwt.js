/**
 * Проверка JWT в заголовке Authorization: Bearer <token>.
 * Успешная проверка: req.user = { sub, login, role, iat, exp ... }
 */
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

export function requireAuth(req, res, next) {
  const raw = req.headers.authorization;
  if (!raw?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }
  const token = raw.slice(7).trim();
  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Недействительный или просроченный токен' });
  }
}
