// ─── Cart API layer ───────────────────────────────────────────────────────────
// Saare cart routes CUSTOMER-only hain (auth zaroori). Axios interceptor token
// automatically lagaata hai — yahan kuch extra nahi karna.
import api from "@/lib/axios";

export interface CartArticle {
  id: string;
  name: string;
  photo: string | null;
  price: string; // Decimal → string
  mrp: string;
  unit: string;
}

export interface CartItem {
  id: string;
  qty: number;
  articleId: string;
  customerId: string;
  createdAt: string;
  article: CartArticle;
}

export interface Cart {
  items: CartItem[];
  subtotal: string; // backend toFixed(2) string deta hai
}

type ApiOk<T> = { success: true; data: T };

export async function getCart(): Promise<Cart> {
  const { data } = await api.get<ApiOk<Cart>>("/cart");
  return data.data;
}

// upsert: qty TOTAL bhejte hain (delta nahi). "+" dabane pe current qty + 1 bhejo.
export async function addToCart(articleId: string, qty: number): Promise<CartItem> {
  const { data } = await api.post<ApiOk<{ item: CartItem }>>("/cart/items", {
    articleId,
    qty,
  });
  return data.data.item;
}

export async function updateCartItem(id: string, qty: number): Promise<CartItem> {
  const { data } = await api.patch<ApiOk<{ item: CartItem }>>(
    `/cart/items/${id}`,
    { qty },
  );
  return data.data.item;
}

export async function removeCartItem(id: string): Promise<void> {
  await api.delete(`/cart/items/${id}`);
}

export async function clearCart(): Promise<void> {
  await api.delete("/cart");
}
