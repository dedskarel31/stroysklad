# ИС «СтройСклад» — учёт строительных материалов

Дипломная работа. Соответствует требованиям диплома 1-в-1:

- **4 таблицы БД**: `employees`, `materials`, `stock`, `transactions` (раздел 2.5.3)
- **12 REST API эндпоинтов** (таблица 3.3)
- **Транзакционная обработка** с `SELECT FOR UPDATE` (листинг 3.3)
- **Двойной барьер от отрицательных остатков**: программный + `CHECK (quantity >= 0)`
- **Триггер** на создание строки остатка при добавлении материала
- **Роли** `admin` / `user` (администратор / кладовщик)
- **JWT** на 8 часов, bcrypt work factor 10
- **CRUD** материалов и сотрудников через UI (ФТ-9, ФТ-10)
- **Bootstrap 5**, фильтры журнала, индикация дефицита

Тесты: **48/48** (12 из таблицы 3.4 диплома + 36 дополнительных).

---

## Структура

```
stroysklad/
├── backend/                Node.js + Express + PostgreSQL
│   ├── routes/             auth, materials, stock, transactions, employees
│   ├── middleware/         auth (JWT), admin (роль)
│   ├── sql/schema.sql      4 таблицы + индексы + триггер
│   ├── db.js               пул соединений (листинг 3.1)
│   ├── seed.js             тестовые данные ООО Девелум ПГС
│   ├── index.js            точка входа (раздел 3.3.4)
│   ├── test_e2e.js         48 тестов
│   ├── Dockerfile          для Railway
│   ├── package.json
│   └── .env.example
└── frontend/               React 18 + Vite + Bootstrap 5
    ├── src/
    │   ├── api/axiosInstance.js   (листинг 3.5)
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── PrivateRoute.jsx   (листинг 3.4)
    │   ├── pages/
    │   │   ├── Login.jsx          /login
    │   │   ├── Dashboard.jsx      /dashboard
    │   │   ├── Operations.jsx     /operations
    │   │   ├── Journal.jsx        /journal
    │   │   └── admin/
    │   │       ├── Materials.jsx  /admin/materials
    │   │       └── Employees.jsx  /admin/employees
    │   ├── App.jsx, main.jsx, styles.css
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── .env.example
```

---

## Локальный запуск

### 1. PostgreSQL

Установи Postgres 14+ и создай БД:

```sql
CREATE DATABASE stroysklad;
CREATE USER stroysklad WITH PASSWORD 'changeme';
GRANT ALL PRIVILEGES ON DATABASE stroysklad TO stroysklad;
ALTER DATABASE stroysklad OWNER TO stroysklad;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Отредактируй .env — пропиши свои DB_* и JWT_SECRET
npm install
npm run db:init   # создаст схему + загрузит тестовые данные
npm run dev       # сервер на http://localhost:3001
```

После `db:init` будет доступно:
- `admin` / `Admin123` (администратор)
- `sklad1` / `User123` (кладовщик)

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# В .env: VITE_API_URL=http://localhost:3001
npm install
npm run dev       # фронт на http://localhost:5173
```

Открой http://localhost:5173 — войди как `admin / Admin123`.

---

## Деплой

### Backend → Railway

1. **Создай PostgreSQL** в Railway (если ещё нет). Скопируй `DATABASE_URL` из вкладки Variables.

2. **Создай сервис** из репозитория (или через `railway up`). В Variables укажи:
   ```
   DATABASE_URL = <тот же URL из Postgres сервиса>
   JWT_SECRET   = <длинная случайная строка, мин. 32 символа>
   PORT         = 3001
   CORS_ORIGINS = https://your-frontend.vercel.app
   ```

3. **Накати схему и seed на продакшен-базе.** Это разовая операция:
   - Подключись к Railway-Postgres локально через connection string
   - Запусти из backend:
     ```bash
     DATABASE_URL="postgresql://..." npm run db:init
     ```
   Это обнулит БД и создаст все 4 таблицы + загрузит тестовые данные.

4. **Деплой**: Railway увидит `Dockerfile` в `backend/` и соберёт автоматически. Если у тебя там уже задеплоен старый бэкенд — корневой каталог сервиса в Railway должен быть `backend/`.

5. Открой `https://your-backend.up.railway.app/api/health` — должен вернуть `{"ok":true,...}`.

### Frontend → Vercel

1. **Settings → Root Directory** = `frontend`
2. **Framework** = Vite (определится автоматически)
3. **Environment Variables**:
   ```
   VITE_API_URL = https://your-backend.up.railway.app
   ```
   (Без `/api` в конце — слово добавляется в коде.)
4. Push → Vercel пересоберёт.

Не забудь добавить домен Vercel в `CORS_ORIGINS` на Railway-бэкенде.

---

## Соответствие диплому (чек-лист для защиты)

| Требование диплома | Реализация |
|---|---|
| **ФТ-1** Аутентификация admin/user | `POST /api/auth/login` + JWT + middleware |
| **ФТ-2** Справочник материалов (name, unit, min_quantity) | таблица `materials` |
| **ФТ-3** Остатки с цветовой индикацией дефицита | Dashboard, `is_deficit` в API, `table-danger` |
| **ФТ-4** Приходная операция | `POST /api/transactions/income` |
| **ФТ-5** Расходная операция с проверкой запаса | `POST /api/transactions/expense` |
| **ФТ-6** Отклонение расхода при нехватке | HTTP 400 «Недостаточно материала на складе» |
| **ФТ-7** Атомарность операций | `BEGIN; ...; COMMIT;` + `ROLLBACK` |
| **ФТ-8** Журнал с фильтрами по типу и дате | `GET /api/transactions?type&date_from&date_to` |
| **ФТ-9** CRUD материалов | `GET/POST/PUT/DELETE /api/materials` + UI |
| **ФТ-10** CRUD сотрудников | `GET/POST/DELETE /api/employees` + UI |
| **НТ-1** Время ответа до 2с | индексы на `transactions(material_id, created_at, type)` |
| **НТ-2** Кросс-браузерность | React + Bootstrap 5, без deprecated API |
| **НТ-3** Пароли — bcrypt | `bcrypt.hash(password, 10)` везде |
| **НТ-4** JWT без сессий | `jsonwebtoken` HS256, 8h |
| **НТ-5** REST + CORS | `cors` middleware с whitelist |
| **НТ-6** Невозможность отрицательных остатков | `CHECK (quantity >= 0)` + `SELECT FOR UPDATE` |

### Соответствие листингам диплома

| Листинг | Файл |
|---|---|
| 3.1 — пул соединений | `backend/db.js` |
| 3.2 — `/api/auth/login` | `backend/routes/auth.js` |
| 3.3 — транзакционный расход с `SELECT FOR UPDATE` | `backend/routes/transactions.js` (expense) |
| 3.4 — `PrivateRoute` | `frontend/src/components/PrivateRoute.jsx` |
| 3.5 — Axios interceptor | `frontend/src/api/axiosInstance.js` |
| 3.6 — DDL таблицы stock с CHECK | `backend/sql/schema.sql` |

### 12 тест-кейсов (таблица 3.4)

Все 12 автоматизированы в `backend/test_e2e.js`. Запуск:

```bash
cd backend
node test_e2e.js
```

Все 48 утверждений (12 базовых + 36 расширенных) проходят.

---

## Полезные команды

```bash
# Backend
npm run dev          # запуск с автоперезагрузкой
npm run db:init      # схема + seed
npm run db:seed      # только seed (на пустую схему)
node test_e2e.js     # запуск 48 тестов

# Frontend
npm run dev          # дев-сервер на :5173
npm run build        # сборка в dist/
npm run preview      # просмотр продакшен-сборки
```

---

## Лицензия и пользователи по умолчанию

После `npm run db:init` создаются:

| Логин | Пароль | Роль | ФИО |
|---|---|---|---|
| `admin` | `Admin123` | admin | Иванов И.И. |
| `sklad1` | `User123` | user | Петров П.П. |
| `sklad2` | `User123` | user | Сидорова А.С. |

И 7 материалов: цемент, арматура, кирпич, пеноблок, песок, щебень, доска — два из них (цемент и кирпич) специально в **дефиците**, чтобы на скриншоте Dashboard сразу было видно красную подсветку.
