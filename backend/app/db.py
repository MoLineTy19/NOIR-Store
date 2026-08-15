import sqlite3
import threading

from .config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY,
    sku         TEXT UNIQUE NOT NULL,
    title       TEXT NOT NULL,
    category    TEXT NOT NULL,           -- hoodie | tshirt | mug | stickers | tote
    price       INTEGER NOT NULL,        -- ₽, целое
    description TEXT NOT NULL DEFAULT '',
    image       TEXT NOT NULL,           -- '/img/products/<файл>.svg'
    colors      TEXT,                    -- JSON-массив или NULL
    sizes       TEXT                     -- JSON-массив или NULL
);

CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    number        TEXT UNIQUE NOT NULL,  -- человекочитаемый номер: NR-1001
    user_id       INTEGER NOT NULL,      -- Telegram ID
    user_name     TEXT NOT NULL DEFAULT '',
    customer_name TEXT NOT NULL,
    phone         TEXT NOT NULL,
    delivery      TEXT NOT NULL,         -- courier | pickup
    address       TEXT,
    subtotal      INTEGER NOT NULL,      -- посчитано НА СЕРВЕРЕ
    delivery_fee  INTEGER NOT NULL DEFAULT 0,
    total         INTEGER NOT NULL,
    status        TEXT NOT NULL DEFAULT 'new',
    created_at    TEXT NOT NULL          -- ISO 8601 UTC
);

CREATE TABLE IF NOT EXISTS order_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    title      TEXT NOT NULL,            -- снапшот на момент заказа
    option     TEXT NOT NULL DEFAULT '', -- 'L · Чёрный'
    price      INTEGER NOT NULL,         -- снапшот цены
    qty        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, id);
"""

_local = threading.local()


def get_conn() -> sqlite3.Connection:
    conn = getattr(_local, "conn", None)
    if conn is None:
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(DB_PATH, timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        _local.conn = conn
    return conn


def init_db() -> None:
    get_conn().executescript(SCHEMA)


def query_all(sql: str, params=()) -> list[dict]:
    cur = get_conn().execute(sql, params)
    return [dict(row) for row in cur.fetchall()]


def query_one(sql: str, params=()) -> dict | None:
    row = get_conn().execute(sql, params).fetchone()
    return dict(row) if row else None


def execute(sql: str, params=()) -> int:
    conn = get_conn()
    cur = conn.execute(sql, params)
    conn.commit()
    return cur.lastrowid