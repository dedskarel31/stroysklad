// Middleware проверки JWT (соответствует разделу 3.3.2 диплома)
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'stroysklad-dev-secret-change-me';

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный или истёкший токен' });
  }
};
