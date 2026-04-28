import dotenv from 'dotenv';

dotenv.config();

/**
 * Базовые переменные окружения сервера.
 */
export const PORT = Number(process.env.PORT) || 3001;
export const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('Не задана переменная окружения DATABASE_URL');
}

/**
 * Настройки JWT.
 */
export const JWT_SECRET = process.env.JWT_SECRET || 'stroysklad-dev-secret-change-in-production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Разрешенные источники для CORS.
 * Можно дополнить через CORS_ORIGINS (CSV), например:
 * CORS_ORIGINS=http://localhost:5173,https://my-app.vercel.app
 */
const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

export const ALLOWED_ORIGINS = [...new Set([...defaultOrigins, ...envOrigins])];
