/** Доступ только для role === admin (после authMiddleware). */
export function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Недостаточно прав для этого действия' });
  }
  next();
}
