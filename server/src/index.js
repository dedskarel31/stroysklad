import cors from 'cors';
import express from 'express';
import { login, me, register } from './controllers/authController.js';
import { listMaterials } from './controllers/materialController.js';
import { createOperationHttp } from './controllers/operationController.js';
import { listStock } from './controllers/stockController.js';
import { ALLOWED_ORIGINS, PORT } from './config.js';
import { initDatabase } from './db/database.js';
import { requireAuth } from './middleware/authJwt.js';

const app = express();
const HOST = '0.0.0.0';

app.use(
  cors({
    // Разрешаем запросы с localhost (Vite) и домена Vercel из CORS_ORIGINS.
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} не разрешен`));
    },
    credentials: true,
  }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'API системы учёта материалов работает' });
});

app.post('/api/login', login);
app.post('/api/register', register);
app.get('/api/me', requireAuth, me);
app.get('/api/materials', requireAuth, listMaterials);
app.get('/api/stock', requireAuth, listStock);
app.post('/api/operations', requireAuth, createOperationHttp);

app.get('/', (_req, res) => {
  res.status(200).send('Warehouse accounting API is running');
});

async function main() {
  await initDatabase();
  console.log('[DB] PostgreSQL подключена.');

  app.listen(PORT, HOST, () => {
    console.log(`[HTTP] Сервер слушает на ${HOST}:${PORT}`);
  });
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
