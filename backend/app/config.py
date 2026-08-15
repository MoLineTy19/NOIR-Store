import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BASE_DIR / ".env")

def _flag(name: str) -> bool:
    return os.getenv(name, "").strip().lower() in ("1", "true", "on")

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
ADMIN_ID = int(os.getenv("ADMIN_ID") or 0)
APP_URL = os.getenv("APP_URL", "").strip().rstrip("/")

DEV_MODE = _flag("DEV_MODE")

AUTH_MAX_AGE = int(os.getenv("AUTH_MAX_AGE") or 24 * 3600)

CORS_ORIGINS = [o for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
DB_PATH = Path(os.getenv("DB_PATH") or BASE_DIR / "backend" / "data" / "noir.db")
FRONTEND_DIST = Path(os.getenv("FRONTEND_DIST") or BASE_DIR / "frontend" / "dist")

DELIVERY_FEE = 390
FREE_DELIVERY_FROM = 5000