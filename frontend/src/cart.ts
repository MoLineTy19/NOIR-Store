import { useSyncExternalStore } from "react";
import type { CartLine, Product } from "./types";

const STORAGE_KEY = "noir-cart-v1";

let lines: CartLine[] = load();
const listeners = new Set<() => void>();

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // localStorage может быть недоступен — корзина живёт до перезагрузки
  }
}

function emit() {
  persist();
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, () => lines, () => lines);
}

function lineKey(product: Product, size?: string, color?: string) {
  return `${product.id}|${size ?? ""}|${color ?? ""}`;
}

export function addToCart(product: Product, size?: string, color?: string, qty = 1) {
  const key = lineKey(product, size, color);
  const index = lines.findIndex((l) => l.key === key);
  if (index >= 0) {
    lines = lines.map((l, i) =>
      i === index ? { ...l, qty: Math.min(99, l.qty + 1) } : l);
  } else {
    lines = [...lines, {
      key, productId: product.id, title: product.title,
      price: product.price, image: product.image, size, color, qty,
    }];
  }
  emit();
}

export function setQty(key: string, qty: number) {
  if (qty < 1) { removeLine(key); return; }
  lines = lines.map((l) => (l.key === key ? { ...l, qty: Math.min(99, qty) } : l));
  emit();
}

export function removeLine(key: string) {
  lines = lines.filter((l) => l.key !== key);
  emit();
}

export function clearCart() {
  lines = [];
  emit();
}

export const cartCount = (ls: CartLine[]) => ls.reduce((s, l) => s + l.qty, 0);
export const cartSubtotal = (ls: CartLine[]) => ls.reduce((s, l) => s + l.qty * l.price, 0);
