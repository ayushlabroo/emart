// ─── Order API layer ──────────────────────────────────────────────────────────
import api from "@/lib/axios";

// Backend OrderStatus enum ke values (string union). UI inhe badges mein dikhata hai.
export type OrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "PICKING"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderItem {
  id: string;
  articleName: string;
  photo: string | null;
  unit: string;
  price: string;
  qty: number;
  mrp?: string;
  articleId?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: string;
  discount: string;
  deliveryFee: string;
  tax: string;
  total: string;
  deliveryLine1: string;
  deliveryCity: string;
  deliveryPincode: string;
  createdAt: string;
  items: OrderItem[];
}

interface OrdersPage {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type ApiOk<T> = { success: true; data: T };

// Checkout: sirf addressId bhejte hain — cart items backend khud DB se leta hai
export async function placeOrder(addressId: string): Promise<Order> {
  const { data } = await api.post<ApiOk<{ order: Order }>>("/orders", { addressId });
  return data.data.order;
}

export async function listOrders(page = 1): Promise<OrdersPage> {
  const { data } = await api.get<ApiOk<OrdersPage>>("/orders", {
    params: { page, limit: 20 },
  });
  return data.data;
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await api.get<ApiOk<{ order: Order }>>(`/orders/${id}`);
  return data.data.order;
}

export async function cancelOrder(id: string): Promise<void> {
  await api.post(`/orders/${id}/cancel`, {});
}

export async function requestReturn(id: string): Promise<void> {
  await api.post(`/orders/${id}/return`, {});
}
