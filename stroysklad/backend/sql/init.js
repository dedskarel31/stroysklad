// Применение схемы БД из schema.sql + запуск seed
const fs = require('fs');
const path = require('path');
const pool = require('../db');

(async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log('[db:init] Применяю schema.sql...');
    await pool.query(sql);
    console.log('[db:init] Схема создана');

    // Запускаем seed
    console.log('[db:init] Запускаю seed...');
    require('../seed');
  } catch (err) {
    console.error('[db:init] Ошибка:', err);
    process.exit(1);
  }
})();
