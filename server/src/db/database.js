import { Pool } from 'pg';
import { DATABASE_URL } from '../config.js';
import { ensureSchema } from './ensureSchema.js';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
});

export async function initDatabase() {
  await pool.query('SELECT 1');
  await ensureSchema();
}
