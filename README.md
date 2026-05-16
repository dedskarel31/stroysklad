# Учёт материалов на складе

Информационная система для учёта материалов на складе (веб-приложение).

- `client` — Frontend на React + Vite + Bootstrap
- `server` — Backend на Node.js + Express + PostgreSQL
- Авторизация — JWT (токен хранится в `localStorage`)

## 1) Локальный запуск (PostgreSQL + Backend + Frontend)

### Требования

- Node.js 22+
- npm
- PostgreSQL 14+ (локально) или доступная удаленная БД

### Шаги

1. Установите зависимости:

```bash
cd server
npm install
cd ../client
npm install
```

2. Настройте переменные окружения Backend:

- Скопируйте `server/.env.example` в `server/.env`
- Укажите корректный `DATABASE_URL`

Пример `server/.env`:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stroysklad
JWT_SECRET=your_strong_secret_key
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173
```

3. Инициализируйте БД (таблицы + seed):

```bash
cd server
npm run db:init
```

4. Запустите Backend:

```bash
cd server
npm run dev
```

5. Настройте переменные окружения Frontend:

- Скопируйте `client/.env.example` в `client/.env`

Пример `client/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

6. Запустите Frontend:

```bash
cd client
npm run dev
```

После запуска:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:3001/api/health`

Тестовый пользователь из seed:

- login: `admin`
- password: `admin123`

---

## 2) Деплой Backend (`server`) на Railway

### Подготовка

1. Подключите GitHub-репозиторий к Railway.
2. Создайте сервис PostgreSQL в Railway.
3. Создайте сервис Backend из этого репозитория:
   - **Root Directory**: `server`
   - Deploy method: `Dockerfile` (в проекте уже есть `server/Dockerfile`)

### Переменные окружения Backend в Railway

Добавьте в Variables:

- `DATABASE_URL` — обычно подтягивается автоматически от PostgreSQL service
- `JWT_SECRET` — длинный случайный ключ
- `JWT_EXPIRES_IN=7d`
- `CORS_ORIGINS=https://<your-vercel-domain>.vercel.app,http://localhost:5173`

### Важно по сети Railway

- Приложение слушает `process.env.PORT` и хост `0.0.0.0`
- В `Networking` у публичного домена порт должен совпадать с портом, который использует сервис (часто `8080`)

### Инициализация БД для Railway

Выполните один раз:

```bash
cd server
npm run db:init
```

Для инициализации Railway-БД локально используйте `DATABASE_URL` из Railway в `server/.env`, затем запустите `npm run db:init`.

### Проверка Backend

- `https://<your-railway-domain>/`
- `https://<your-railway-domain>/api/health`

---

## 3) Деплой Frontend (`client`) на Vercel

1. Импортируйте GitHub-репозиторий в Vercel.
2. Укажите:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. Добавьте переменную окружения:

```env
VITE_API_URL=https://<your-railway-domain>/api
```

4. Запустите Deploy.

### Проверка Frontend

- Откройте домен Vercel
- Выполните вход `admin/admin123`
- Проверьте страницы:
  - Остатки
  - Новая операция

---

## API (кратко)

- `POST /api/login`
- `GET /api/materials` (JWT)
- `GET /api/stock` (JWT)
- `POST /api/operations` (JWT)

Для расхода (`expense`) используется транзакция PostgreSQL и проверка остатка.
Если количества недостаточно — API возвращает `400` и сообщение:
`Недостаточно материала на складе`.
