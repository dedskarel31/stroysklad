import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

/** Проверка Bearer JWT; req.user = { id, role } */
export function authMiddleware(req, res, next) {
  const raw = req.headers.authorization;
  if (!raw?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  const token = raw.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Недействительный или просроченный токен' });
  }
}
