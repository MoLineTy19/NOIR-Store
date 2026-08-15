import asyncio
import json
import re
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from . import db, seed
from .auth import current_user
from .bot import notify_order_created, create_bot, build_dispatcher, apply_menu_button
from .config import (ADMIN_ID, APP_URL, BOT_TOKEN, CORS_ORIGINS, DELIVERY_FEE,
                     DEV_MODE, FREE_DELIVERY_FROM, FRONTEND_DIST)
from .schemas import OrderIn

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s %(name)s %(levelname)s %(message)s")
log = logging.getLogger("noir")

CATEGORY_LABELS = {"hoodie": "Худи", "tshirt": "Футболки", "mug": "Кружки",
                   "stickers": "Стикеры", "tote": "Шоперы"}


def _stage(created_at: str, delivery: str) -> dict:
    """Демо-жизнь заказа: статус из возраста, без фоновых задач."""
    age = (datetime.now(timezone.utc)
           - datetime.fromisoformat(created_at)).total_seconds()
    if age < 45:
        return {"status": "new", "status_label": "Принят"}
    if age < 3 * 60:
        return {"status": "confirmed", "status_label": "Подтверждён"}
    if age < 10 * 60:
        return {"status": "assembling", "status_label": "Собирается"}
    if age < 24 * 3600:
        label = "В доставке" if delivery == "courier" else "Готов к выдаче"
        return {"status": "shipped", "status_label": label}
    return {"status": "done", "status_label": "Выполнен"}


async def _run_bot(app: FastAPI) -> None:
    try:
        await app.state.bot.delete_webhook(drop_pending_updates=True)
        await app.state.dp.start_polling(app.state.bot, handle_signals=False)
    except asyncio.CancelledError:
        pass
    except Exception:
        log.exception("Polling упал")


_notify_tasks: set[asyncio.Task] = set()


async def _notify(app: FastAPI, order: dict, lines: list[dict], user: dict) -> None:
    try:
        await notify_order_created(app.state.bot, ADMIN_ID, order, lines, user)
    except Exception:
        log.exception("Уведомления о заказе не отправлены")


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    seed.seed_if_empty()

    app.state.bot = None
    app.state.dp = None
    app.state.bot_task = None

    if BOT_TOKEN:
        try:
            app.state.bot = create_bot(BOT_TOKEN)
            app.state.dp = build_dispatcher(APP_URL or None)
            if APP_URL:
                await apply_menu_button(app.state.bot, APP_URL)
            app.state.bot_task = asyncio.create_task(_run_bot(app))
        except Exception:
            log.exception("Бот не запустился, API продолжает работать")
            app.state.bot = None
    else:
        log.warning("BOT_TOKEN пуст: бот и уведомления выключены")

    log.info("DEV_MODE=%s, dist: %s",
             DEV_MODE, (FRONTEND_DIST / "index.html").exists())
    yield

    if app.state.bot_task:
        app.state.bot_task.cancel()
        await asyncio.gather(app.state.bot_task, return_exceptions=True)
    if app.state.bot:
        await app.state.bot.session.close()


app = FastAPI(title="NOIR Store Mini App", lifespan=lifespan)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/me")
def me(request: Request):
    return current_user(request)


@app.get("/api/catalog")
def catalog():
    products = db.query_all("SELECT * FROM products ORDER BY id")
    items = [{
        "id": p["id"], "sku": p["sku"], "title": p["title"],
        "category": p["category"], "price": p["price"],
        "description": p["description"], "image": p["image"],
        "colors": json.loads(p["colors"]) if p["colors"] else None,
        "sizes": json.loads(p["sizes"]) if p["sizes"] else None,
    } for p in products]
    present = {p["category"] for p in products}
    categories = [{"key": k, "label": v} for k, v in CATEGORY_LABELS.items()
                  if k in present]
    return {"categories": categories, "delivery_fee": DELIVERY_FEE,
            "free_delivery_from": FREE_DELIVERY_FROM, "products": items}


@app.post("/api/orders")
async def create_order(order: OrderIn, request: Request):
    user = current_user(request)

    if len(re.sub(r"\D", "", order.phone)) < 10:
        raise HTTPException(422, "Укажите телефон полностью")
    address = (order.address or "").strip()
    if order.delivery == "courier" and len(address) < 5:
        raise HTTPException(422, "Укажите адрес доставки")

    lines, subtotal = [], 0
    for item in order.items:
        product = db.query_one("SELECT * FROM products WHERE id = ?",
                               (item.product_id,))
        if not product:
            raise HTTPException(422, f"Товар {item.product_id} не найден")
        sizes = json.loads(product["sizes"]) if product["sizes"] else None
        colors = json.loads(product["colors"]) if product["colors"] else None
        if sizes and item.size not in sizes:
            raise HTTPException(422, f"{product['title']}: выберите размер")
        if colors and item.color not in colors:
            raise HTTPException(422, f"{product['title']}: выберите цвет")
        option = " · ".join(p for p in (item.size, item.color) if p) or "стандарт"
        subtotal += product["price"] * item.qty
        lines.append({"product_id": product["id"], "title": product["title"],
                      "price": product["price"], "qty": item.qty, "option": option})

    fee = 0 if order.delivery == "pickup" or subtotal >= FREE_DELIVERY_FROM else DELIVERY_FEE
    total = subtotal + fee
    now = datetime.now(timezone.utc).isoformat()
    user_name = " ".join(x for x in (user["first_name"], user["last_name"]) if x)

    # number зависит от id, поэтому вставляем пустой и обновляем
    order_id = db.execute(
        "INSERT INTO orders (number, user_id, user_name, customer_name, phone,"
        " delivery, address, subtotal, delivery_fee, total, status, created_at)"
        " VALUES ('', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)",
        (user["id"], user_name, order.customer_name.strip(), order.phone.strip(),
         order.delivery, address or None, subtotal, fee, total, now))
    number = f"NR-{1000 + order_id}"
    db.execute("UPDATE orders SET number = ? WHERE id = ?", (number, order_id))
    for line in lines:
        db.execute(
            "INSERT INTO order_items (order_id, product_id, title, price, qty, option)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            (order_id, line["product_id"], line["title"], line["price"],
             line["qty"], line["option"]))

    if request.app.state.bot:
        task = asyncio.create_task(_notify(
            request.app,
            {"number": number, "delivery": order.delivery, "address": address,
             "total": total, "customer_name": order.customer_name.strip()},
            lines, user))
        # без живой ссылки task может собрать GC до отправки
        _notify_tasks.add(task)
        task.add_done_callback(_notify_tasks.discard)

    return {"id": order_id, "number": number, "subtotal": subtotal,
            "delivery_fee": fee, "total": total, **_stage(now, order.delivery)}


@app.get("/api/orders")
def list_orders(request: Request):
    user = current_user(request)
    orders = db.query_all(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 50",
        (user["id"],))
    result = []
    for o in orders:
        items = db.query_all(
            "SELECT title, option, price, qty FROM order_items WHERE order_id = ?",
            (o["id"],))
        result.append({"id": o["id"], "number": o["number"],
                       "created_at": o["created_at"], "delivery": o["delivery"],
                       "total": o["total"], "items": items,
                       **_stage(o["created_at"], o["delivery"])})
    return {"orders": result}


# Строго ПОСЛЕ всех роутов: раздача собранного фронта
if (FRONTEND_DIST / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="spa")

if CORS_ORIGINS:
    app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS,
                       allow_methods=["*"], allow_headers=["*"])