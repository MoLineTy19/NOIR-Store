# NOIR Store

Демо-магазин мерча в виде Telegram Mini App: каталог, карточка товара, корзина,
оформление заказа и список заказов. Оплата не подключена — заказ попадает в базу
и дублируется уведомлениями админу и клиенту.

## Стек

- Backend: FastAPI + aiogram 3, SQLite (WAL), без ORM
- Frontend: React 18 + TypeScript, Vite; Telegram WebApp API (MainButton,
  BackButton, haptic, тема)

## Запуск

Backend:

    cd backend
    uv sync                  # или: pip install -r requirements.txt
    cp .env.example .env
    uvicorn app.main:app --reload

Без `BOT_TOKEN` работает только API. `DEV_MODE=1` включает гостевого
пользователя — приложение открывается в обычном браузере.

Frontend для разработки:

    cd frontend
    npm install
    npm run dev              # порт 5173, /api проксируется на 8000

Для прода: `npm run build` — собранный `dist/` раздаёт FastAPI сам.

## Демо-логика

Статус заказа вычисляется из его возраста: «Принят» → «Подтверждён» →
«Собирается» → «В доставке» → «Выполнен». Фоновых задач нет, ничего
дописывать в базу со временем не нужно.
