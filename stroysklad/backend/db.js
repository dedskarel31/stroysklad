// Пул соединений с PostgreSQL (соответствует листингу 3.1 диплома)
const { Pool } = require('pg');
require('dotenv').config();

// Railway даёт DATABASE_URL целиком; локально — отдельные параметры
const useUrl = !!process.env.DATABASE_URL;

const pool = useUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      // На Railway PostgreSQL требует SSL, локально — нет
      ssl: process.env.DATABASE_URL.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
      max: 10,
    })
  : new Pool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 5432,
      database: process.env.DB_NAME     || 'stroysklad',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 10,
    });

pool.on('error', (err) => {
  console.error('[pg pool] Неожиданная ошибка пула:', err);
});

module.exports = pool;
