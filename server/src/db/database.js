import { Pool } from 'pg';
import { DATABASE_URL } from '../config.js';
import { ensureMaterialsCatalog } from './seedMaterials.js';

/**
 * Единый пул подключений к PostgreSQL.
 */
export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
});

/**
 * Проверка, что БД доступна при старте сервера.
 */
export async function initDatabase() {
  await pool.query('SELECT 1');
  await ensureMaterialsCatalog();
}
