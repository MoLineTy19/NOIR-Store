# NOIR Store

[![CI](https://github.com/MoLineTy19/NOIR-Store/actions/workflows/ci.yml/badge.svg)](https://github.com/MoLineTy19/NOIR-Store/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.12%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Демо-магазин мерча в виде Telegram Mini App: каталог, корзина, оформление заказа
и список заказов. Оплата не подключена — заказ попадает в базу и дублируется
уведомлениями админу и клиенту в Telegram.

## Возможности

- 12 демо-товаров в пяти категориях, поиск и фильтры по категориям
- Карточка товара с выбором цвета и размера
- Корзина живёт в localStorage и переживает перезагрузку
- Оформление: курьер или самовывоз, бесплатная доставка от 5 000 ₽,
  подсказки в невалидных полях после попытки отправки
- Состав заказа и итоговая сумма пересчитываются на сервере, подпись initData
  проверяется через HMAC-SHA256
- «Мои заказы» со статусами; статус вычисляется из возраста заказа, фоновых
  задач нет
- Нативное для Telegram: MainButton, BackButton, haptic, тема, подтверждение
  при закрытии с товарами в корзине

## Стек

- Backend: Python 3.12, FastAPI, aiogram 3, SQLite (WAL) без ORM
- Frontend: React 18, TypeScript, Vite, vanilla CSS

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

Для прода `npm run build` — собранный `dist/` раздаёт FastAPI сам.

## Переменные окружения

| Переменная | По умолчанию | Что делает |
|---|---|---|
| `BOT_TOKEN` | — | токен из BotFather; без него бот и уведомления выключены |
| `ADMIN_ID` | — | Telegram ID, куда приходят уведомления о заказах |
| `APP_URL` | — | публичный https-URL Mini App для кнопки «Открыть магазин» и Menu Button |
| `DEV_MODE` | `0` | `1` — гостевой пользователь без проверки подписи. Только для разработки |
| `AUTH_MAX_AGE` | `86400` | сколько секунд initData считается свежим |
| `DB_PATH` | `backend/data/noir.db` | путь к базе SQLite |
| `FRONTEND_DIST` | `frontend/dist` | папка собранного фронта |
| `CORS_ORIGINS` | — | origins через запятую, если фронт живёт на другом домене |

## Деплой

1. Собрать фронт: `npm run build` в `frontend/`.
2. Запустить на сервере `uvicorn app.main:app` за reverse-proxy с HTTPS
   (Caddy, Nginx).
3. В BotFather создать приложение (`/newapp`) и указать URL.
4. Заполнить `BOT_TOKEN`, `ADMIN_ID`, `APP_URL` в `.env`.

## Структура

```
backend/app/
  main.py      API-роуты и раздача собранного фронта
  bot.py       /start, уведомления о заказах
  auth.py      проверка подписи initData
  db.py        SQLite, соединение на поток
  seed.py      демо-товары
  config.py    переменные окружения
  schemas.py   схемы входящих заказов
frontend/src/
  screens/     Catalog, ProductSheet, Cart, Checkout, Success, Orders
  tg.ts        обёртка над Telegram WebApp API
  cart.ts      корзина: useSyncExternalStore + localStorage
  api.ts       запросы к API
```
