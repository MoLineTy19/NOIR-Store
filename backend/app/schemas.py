from typing import Literal

from pydantic import BaseModel, Field


class OrderItemIn(BaseModel):
    product_id: int
    qty: int = Field(ge=1, le=99)
    size: str | None = None    # обязателен, если у товара есть sizes
    color: str | None = None   # обязателен, если у товара есть colors


class OrderIn(BaseModel):
    items: list[OrderItemIn] = Field(min_length=1, max_length=50)
    customer_name: str = Field(min_length=2, max_length=64)
    phone: str = Field(min_length=10, max_length=24)
    delivery: Literal["courier", "pickup"]
    address: str | None = Field(default=None, max_length=200)
