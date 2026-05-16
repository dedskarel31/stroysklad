// Middleware проверки роли admin
module.exports = function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещён: требуется роль администратора' });
  }
  next();
};
