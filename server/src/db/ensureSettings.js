import { pool } from './database.js';

const DEFAULTS = [
  ['allow_registration', 'true'],
  ['organization_name', 'Учёт материалов на складе'],
];

export async function ensureSystemSettings() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  for (const [key, value] of DEFAULTS) {
    await pool.query(
      `INSERT INTO system_settings (key, value)
       VALUES ($1, $2)
       ON CONFLICT (key) DO NOTHING`,
      [key, value],
    );
  }
}
