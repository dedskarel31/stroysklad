import cors from 'cors';
import express from 'express';
import { ALLOWED_ORIGINS, PORT } from './config.js';
import { initDatabase } from './db/database.js';
import authRoutes from './routes/auth.js';
import materialsRoutes from './routes/materials.js';
import stockRoutes from './routes/stock.js';
import transactionsRoutes from './routes/transactions.js';
import employeesRoutes from './routes/employees.js';

const app = express();
const HOST = '0.0.0.0';

app.use(
  cors({
    origin: ALLOWED_ORIGINS === true ? true : (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'СтройСклад API работает' });
});

app.use('/api/auth', authRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/employees', employeesRoutes);

app.get('/', (_req, res) => {
  res.status(200).send('СтройСклад — API складского учёта (ООО «Девелум ПГС»)');
});

async function main() {
  await initDatabase();
  console.log('[DB] PostgreSQL подключена.');

  app.listen(PORT, HOST, () => {
    console.log(`[HTTP] Сервер: ${HOST}:${PORT}`);
  });
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
