import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './database.js';
import { ensureMaterialsCatalog } from './seedMaterials.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlDir = path.resolve(__dirname, '..', '..', 'sql');

async function runSqlFile(fileName) {
  const fullPath = path.join(sqlDir, fileName);
  const sql = await fs.readFile(fullPath, 'utf8');
  await pool.query(sql);
  console.log(`[DB] Выполнен ${fileName}`);
}

async function initDb() {
  try {
    // Сначала создаем структуру, затем заполняем тестовыми данными.
    await runSqlFile('schema.sql');
    await runSqlFile('seed.sql');
    await ensureMaterialsCatalog();
    console.log('[DB] Инициализация PostgreSQL завершена.');
  } finally {
    await pool.end();
  }
}

initDb().catch((error) => {
  console.error('[DB] Ошибка инициализации:', error);
  process.exit(1);
});
