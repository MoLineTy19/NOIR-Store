import html
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo, MenuButtonWebApp

log = logging.getLogger("noir.bot")

START_TEXT = (
    "NOIR Store — мерч-магазин внутри Telegram.\n\n"
    "Каталог, корзина и заказ в один тап. Оплата в демо-режиме не списывается."
)

def create_bot(token: str) -> Bot:
    return Bot(token=token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))

def build_dispatcher(app_url: str | None) -> Dispatcher:
    dp = Dispatcher()

    @dp.message(CommandStart())
    async def _start(message: Message) -> None:
        keyboard = None
        if app_url:
            keyboard = InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(text="Открыть магазин",
                                     web_app=WebAppInfo(url=app_url))
            ]])
        await message.answer(START_TEXT, reply_markup=keyboard)

    return dp

async def apply_menu_button(bot: Bot, app_url: str) -> None:
    try:
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(text="Магазин",
                                         web_app=WebAppInfo(url=app_url)))
    except Exception as exc:
        log.warning("Menu button не установлен: %s", exc)

def _money(n: int) -> str:
    return f"{n:,}".replace(",", " ") + " ₽"


def _esc(value) -> str:
    return html.escape(str(value or ""))

async def notify_order_created(bot: Bot, admin_id: int, order: dict,
                               items: list[dict], user: dict) -> None:
    lines = [
        f"• {_esc(it['title'])} · {_esc(it['option'])} × {it['qty']}"
        f" — {_money(it['price'] * it['qty'])}"
        for it in items
    ]
    delivery = "Доставка курьером" if order["delivery"] == "courier" else "Самовывоз"
    if order["delivery"] == "courier" and order.get("address"):
        delivery += f": {_esc(order['address'])}"

    admin_text = "\n".join([
        f"Новый заказ {order['number']}",
        "",
        *lines,
        "",
        f"Доставка: {delivery}",
        f"Итого: {_money(order['total'])}",
        "",
        f"Клиент: {_esc(order['customer_name'])} · {_esc(order['phone'])}",
    ])
    if user.get("username"):
        admin_text += f" · @{_esc(user['username'])}"
    admin_text += f" · id {user['id']}"

    if admin_id:
        try:
            await bot.send_message(admin_id, admin_text)
        except Exception as exc:
            log.warning("Уведомление админу не ушло: %s", exc)
    else:
        log.warning("ADMIN_ID не задан — уведомление админу пропущено")

    client_text = (
        f"Заказ {order['number']} принят\n\n"
        f"Сумма: {_money(order['total'])}\n"
        "Статус можно смотреть в разделе «Мои заказы».\n"
        "Спасибо, что выбрали NOIR!"
    )
    try:
        await bot.send_message(user["id"], client_text)
    except Exception as exc:
        log.warning("Подтверждение клиенту не ушло: %s", exc)
