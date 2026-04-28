import cors from 'cors';
import express from 'express';
import { ALLOWED_ORIGINS, PORT } from './config.js';
import { initDatabase } from './db/database.js';

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
  res.json({ ok: true, message: 'СтройСклад API работает' });
});

app.get('/', (_req, res) => {
  res.status(200).send('StroySklad backend is running');
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
