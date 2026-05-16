import dotenv from 'dotenv';

dotenv.config();

export const PORT = Number(process.env.PORT) || 3001;

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const name = process.env.DB_NAME || 'stroysklad';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  return `postgresql://${user}:${password}@${host}:${port}/${name}`;
}

export const DATABASE_URL = buildDatabaseUrl();

export const JWT_SECRET = process.env.JWT_SECRET || 'stroysklad-dev-secret-change-in-production';
export const JWT_EXPIRES_IN = '8h';

const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

export const ALLOWED_ORIGINS =
  process.env.CORS_ALLOW_ALL === 'true'
    ? true
    : [...new Set([...defaultOrigins, ...envOrigins])];
