export interface Product {
  id: number;
  sku: string;
  title: string;
  category: string;
  price: number;
  description: string;
  image: string;
  colors: string[] | null;
  sizes: string[] | null;
}

export interface CatalogResponse {
  categories: { key: string; label: string }[];
  delivery_fee: number;
  free_delivery_from: number;
  products: Product[];
}

export interface CartLine {
  key: string; // productId|size|color
  productId: number;
  title: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  qty: number;
}

export interface OrderItem {
  title: string;
  option: string;
  price: number;
  qty: number;
}

export interface Order {
  id: number;
  number: string;
  created_at: string;
  delivery: "courier" | "pickup";
  total: number;
  status: string;
  status_label: string;
  items: OrderItem[];
}

export interface CreatedOrder {
  id: number;
  number: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  status_label: string;
}

export interface TgUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export interface OrderPayload {
  items: { product_id: number; qty: number; size?: string; color?: string }[];
  customer_name: string;
  phone: string;
  delivery: "courier" | "pickup";
  address?: string;
}