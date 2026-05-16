import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './database.js';
import { runSeed } from '../../seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlDir = path.resolve(__dirname, '..', '..', 'sql');

async function readSql(name) {
  return fs.readFile(path.join(sqlDir, name), 'utf8');
}

async function getEmployeeColumns() {
  const { rows } = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'employees'`,
  );
  return new Set(rows.map((r) => r.column_name));
}

async function hasTable(name) {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [name],
  );
  return rows.length > 0;
}

/**
 * Применяет схему диплома и тестовые данные, если БД пустая или со старой структурой.
 */
export async function ensureSchema() {
  const employeeCols = await getEmployeeColumns();
  const hasOldStock = await hasTable('stock_balances');
  const hasNewStock = await hasTable('stock');
  const hasTransactions = await hasTable('transactions');

  const mustMigrate =
    employeeCols.size === 0 ||
    !employeeCols.has('username') ||
    hasOldStock ||
    !hasTransactions;

  if (mustMigrate) {
    console.log('[DB] Обнаружена старая/пустая схема — выполняется миграция...');
    await pool.query(await readSql('schema.sql'));
    await pool.query(await readSql('seed.sql'));
    await runSeed({ closePool: false });
    console.log('[DB] Миграция завершена (admin / Admin123, sklad1 / User123).');
    return;
  }

  if (!hasNewStock && (await hasTable('materials'))) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock (
        material_id INTEGER PRIMARY KEY REFERENCES materials(id) ON DELETE CASCADE,
        quantity NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0)
      );
    `);
  }

  await runSeed({ closePool: false });
}
