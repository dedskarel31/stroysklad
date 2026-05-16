/**
 * Настройки системы — только администратор.
 */
import { pool } from '../db/database.js';

const DEFAULTS = {
  allow_registration: 'true',
  organization_name: 'Учёт материалов на складе',
};

export async function getSettings(_req, res) {
  try {
    const { rows } = await pool.query('SELECT key, value FROM system_settings');
    const settings = { ...DEFAULTS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (e) {
    console.error('[settings get]', e);
    res.status(500).json({ message: 'Не удалось получить настройки' });
  }
}

export async function updateSettings(req, res) {
  const { allow_registration, organization_name } = req.body ?? {};

  if (allow_registration !== undefined && allow_registration !== true && allow_registration !== false) {
    return res.status(400).json({ message: 'allow_registration должен быть true или false' });
  }

  if (organization_name !== undefined) {
    const name = String(organization_name).trim();
    if (!name || name.length > 255) {
      return res.status(400).json({ message: 'Укажите название организации (до 255 символов)' });
    }
  }

  try {
    if (allow_registration !== undefined) {
      await upsertSetting('allow_registration', allow_registration ? 'true' : 'false');
    }
    if (organization_name !== undefined) {
      await upsertSetting('organization_name', String(organization_name).trim());
    }

    const { rows } = await pool.query('SELECT key, value FROM system_settings');
    const settings = { ...DEFAULTS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (e) {
    console.error('[settings patch]', e);
    res.status(500).json({ message: 'Не удалось сохранить настройки' });
  }
}

/** Публично: можно ли регистрироваться (без авторизации). */
export async function getPublicSettings(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT value FROM system_settings WHERE key = 'allow_registration'`,
    );
    const raw = rows[0]?.value ?? DEFAULTS.allow_registration;
    res.json({ allow_registration: raw === 'true' });
  } catch (e) {
    res.json({ allow_registration: true });
  }
}

async function upsertSetting(key, value) {
  await pool.query(
    `INSERT INTO system_settings (key, value)
     VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, value],
  );
}
