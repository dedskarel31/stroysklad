import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './database.js';
import { runSeed } from '../../seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlDir = path.resolve(__dirname, '..', '..', 'sql');

async function runSqlFile(fileName) {
  const sql = await fs.readFile(path.join(sqlDir, fileName), 'utf8');
  await pool.query(sql);
  console.log(`[DB] Выполнен ${fileName}`);
}

async function initDb() {
  try {
    await runSqlFile('schema.sql');
    await runSqlFile('seed.sql');
    await runSeed({ closePool: false });
    console.log('[DB] Инициализация завершена.');
  } finally {
    await pool.end();
  }
}

initDb().catch((error) => {
  console.error('[DB] Ошибка инициализации:', error);
  process.exit(1);
});
