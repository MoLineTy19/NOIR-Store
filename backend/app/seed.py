import json

from . import db

SIZES = ["S", "M", "L", "XL", "XXL"]
TOP3 = ["Чёрный", "Графит", "Белый"]
DUO = ["Чёрный", "Белый"]

PRODUCTS = [
    {"sku": "HD-CORE", "title": "Худи «Core»", "category": "hoodie", "price": 4990,
     "description": "Плотный флис, свободный крой, вышитый логотип на груди.",
     "image": "/img/products/hoodie-core.svg", "colors": TOP3, "sizes": SIZES},
    {"sku": "HD-MNHT", "title": "Худи «Midnight»", "category": "hoodie", "price": 5490,
     "description": "Графит, контрастные шнурки, карман-кенгуру.",
     "image": "/img/products/hoodie-midnight.svg", "colors": DUO, "sizes": SIZES},
    {"sku": "HD-BONE", "title": "Худи «Bone»", "category": "hoodie", "price": 4490,
     "description": "Молочный, минимальный принт, унисекс.",
     "image": "/img/products/hoodie-bone.svg",
     "colors": ["Белый", "Молочный"], "sizes": SIZES},
    {"sku": "TS-LOGO", "title": "Футболка «Logo»", "category": "tshirt", "price": 1990,
     "description": "Прямой крой, плотный хлопок, принт NOIR на груди.",
     "image": "/img/products/tee-logo.svg", "colors": TOP3, "sizes": SIZES},
    {"sku": "TS-MONO", "title": "Футболка «Mono»", "category": "tshirt", "price": 2290,
     "description": "Тонкий хлопок, принт-минимализм.",
     "image": "/img/products/tee-mono.svg", "colors": DUO, "sizes": SIZES},
    {"sku": "TS-STATIC", "title": "Футболка «Static»", "category": "tshirt", "price": 1790,
     "description": "Лёгкая, с графичным принтом «шум».",
     "image": "/img/products/tee-static.svg", "colors": DUO, "sizes": SIZES},
    {"sku": "MG-MATTE", "title": "Кружка «Matte»", "category": "mug", "price": 890,
     "description": "Матовая керамика, 350 мл.",
     "image": "/img/products/mug-matte.svg",
     "colors": ["Матовый чёрный", "Белый"], "sizes": None},
    {"sku": "MG-DAILY", "title": "Кружка «Daily»", "category": "mug", "price": 990,
     "description": "Глянцевая керамика, 300 мл.",
     "image": "/img/products/mug-daily.svg", "colors": DUO, "sizes": None},
    {"sku": "ST-SYM", "title": "Стикерпак «Symbols»", "category": "stickers", "price": 490,
     "description": "12 виниловых стикеров, матовая плёнка.",
     "image": "/img/products/stickers-symbols.svg", "colors": None, "sizes": None},
    {"sku": "ST-SHADES", "title": "Стикерпак «Shades»", "category": "stickers", "price": 590,
     "description": "16 стикеров, градации серого.",
     "image": "/img/products/stickers-shades.svg", "colors": None, "sizes": None},
    {"sku": "TT-NATURAL", "title": "Шопер «Tote»", "category": "tote", "price": 990,
     "description": "Плотный хлопок, длинные ручки.",
     "image": "/img/products/tote-natural.svg",
     "colors": ["Молочный", "Чёрный"], "sizes": None},
    {"sku": "TT-NOCT", "title": "Шопер «Nocturne»", "category": "tote", "price": 1190,
     "description": "Тёмный плотный хлопок, внутренний карман.",
     "image": "/img/products/tote-noir.svg",
     "colors": ["Чёрный", "Графит"], "sizes": None},
]


def seed_if_empty() -> None:
    if db.query_one("SELECT COUNT(*) AS n FROM products")["n"] > 0:
        return
    for p in PRODUCTS:
        db.execute(
            "INSERT INTO products (sku, title, category, price, description,"
            " image, colors, sizes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (p["sku"], p["title"], p["category"], p["price"], p["description"],
             p["image"],
             json.dumps(p["colors"]) if p["colors"] else None,
             json.dumps(p["sizes"]) if p["sizes"] else None),
        )
