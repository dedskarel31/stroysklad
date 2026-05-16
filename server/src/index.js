import cors from 'cors';
import express from 'express';
import { login, me, register } from './controllers/authController.js';
import { listMaterials } from './controllers/materialController.js';
import { createOperationHttp, listOperations } from './controllers/operationController.js';
import { getPublicSettings, getSettings, updateSettings } from './controllers/settingsController.js';
import { listStock } from './controllers/stockController.js';
import { listUsers, updateUserRole } from './controllers/userController.js';
import { ALLOWED_ORIGINS, PORT } from './config.js';
import { initDatabase } from './db/database.js';
import { requireAuth } from './middleware/authJwt.js';
import { requireRole } from './middleware/requireRole.js';

const app = express();
const HOST = '0.0.0.0';

const storekeeper = requireRole('storekeeper');
const admin = requireRole('admin');

app.use(
  cors({
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

app.get('/api/settings/public', getPublicSettings);

app.post('/api/login', login);
app.post('/api/register', register);
app.get('/api/me', requireAuth, me);

// Кладовщик: остатки, материалы, операции, отчёты
app.get('/api/stock', requireAuth, storekeeper, listStock);
app.get('/api/materials', requireAuth, storekeeper, listMaterials);
app.get('/api/operations', requireAuth, storekeeper, listOperations);
app.post('/api/operations', requireAuth, storekeeper, createOperationHttp);

// Администратор: пользователи и настройки системы
app.get('/api/admin/users', requireAuth, admin, listUsers);
app.patch('/api/admin/users/:id/role', requireAuth, admin, updateUserRole);
app.get('/api/admin/settings', requireAuth, admin, getSettings);
app.patch('/api/admin/settings', requireAuth, admin, updateSettings);

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
