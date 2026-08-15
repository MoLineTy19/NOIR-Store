import {tg} from "./tg";
import {CatalogResponse, CreatedOrder, Order, OrderPayload, TgUser} from "./types";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Init-Data": tg.initData ?? "",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = typeof data.detail === "string" ? data.detail : "";
    } catch {
      // тело не JSON
    }
    throw new ApiError(res.status, detail || `Ошибка ${res.status}`);
  }
  return (await res.json()) as T;
}


let catalogPromise: Promise<CatalogResponse> | null = null;

export function loadCatalog(): Promise<CatalogResponse> {
  // каталог за сессию не меняется — кэшируем; при ошибке разрешаем ретрай
  if (!catalogPromise) {
    catalogPromise = request<CatalogResponse>("/api/catalog");
    catalogPromise.catch(() => { catalogPromise = null; });
  }
  return catalogPromise;
}

export function fetchMe(): Promise<TgUser> {
  return request<TgUser>("/api/me");
}

export function fetchOrders(): Promise<{ orders: Order[] }> {
  return request<{ orders: Order[] }>("/api/orders");
}

export function createOrder(payload: OrderPayload): Promise<CreatedOrder> {
  return request<CreatedOrder>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
