// Точка входа серверной части (соответствует разделу 3.3.4 диплома)
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const materialsRoutes = require('./routes/materials');
const stockRoutes = require('./routes/stock');
const transactionsRoutes = require('./routes/transactions');
const employeesRoutes = require('./routes/employees');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: разрешаем фронтенд (Vercel или конкретные домены из env)
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Запросы без Origin (Postman, серверные) — пропускаем
    if (!origin) return cb(null, true);
    // Если whitelist пуст — разрешаем все (удобно на демо)
    if (allowedOrigins.length === 0) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} не разрешён`));
  },
  credentials: false,
}));

app.use(express.json({ limit: '1mb' }));

// Healthcheck для Railway
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'СтройСклад API', version: '1.0.0' });
});

app.get('/', (req, res) => {
  res.send('СтройСклад API is running');
});

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/employees', employeesRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Глобальный обработчик ошибок
app.use((err, req, res, _next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[stroysklad] Сервер запущен на порту ${PORT}`);
});
