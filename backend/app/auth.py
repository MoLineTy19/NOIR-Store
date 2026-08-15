"""Авторизация через Telegram initData (HMAC-SHA256)."""
import hashlib
import hmac
import json
import time
from urllib.parse import parse_qs

from fastapi import HTTPException, Request

from .config import BOT_TOKEN, DEV_MODE, AUTH_MAX_AGE

DEV_USER = {"id": 1, "first_name": "Гость", "last_name": "",
            "username": "demo", "photo_url": ""}

def _parse_init_data(raw: str) -> dict:
    # keep_blank_values: пустые поля тоже участвуют в подписи
    return {k: v[0] for k, v in parse_qs(raw, keep_blank_values=True).items()}

def current_user(request: Request) -> dict:
    raw = request.headers.get("X-Init-Data", "")
    if not raw:
        if DEV_MODE:
            return dict(DEV_USER)
        raise HTTPException(401, "Откройте приложение из Telegram")
    if not BOT_TOKEN:
        raise HTTPException(503, "BOT_TOKEN не задан")

    data = _parse_init_data(raw)
    received_hash = data.pop("hash", "")

    check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    calculated = hmac.new(secret, check_string.encode(), hashlib.sha256).hexdigest()

    if not received_hash or not hmac.compare_digest(calculated, received_hash):
        raise HTTPException(401, "Некорректная подпись initData")

    auth_date = int(data.get("auth_date", 0) or 0)
    if auth_date and time.time() - auth_date > AUTH_MAX_AGE:
        raise HTTPException(401, "Сессия устарела, откройте приложение заново")

    try:
        user = json.loads(data.get("user", "{}"))
    except ValueError:
        raise HTTPException(401, "Некорректные данные пользователя")
    if not user.get("id"):
        raise HTTPException(401, "Некорректные данные пользователя")

    return {
        "id": int(user["id"]),
        "first_name": user.get("first_name", ""),
        "last_name": user.get("last_name", ""),
        "username": user.get("username", ""),
        "photo_url": user.get("photo_url", ""),
    }
