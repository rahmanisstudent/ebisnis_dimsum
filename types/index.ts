// ─── Database Entity Types ─────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in IDR (integer)
  image_url: string | null;
  category: string;
  spicy_level: number; // 0 = not spicy, 5 = very spicy
  stock: number;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: "customer" | "admin";
  created_at: string;
}

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  // Joined
  product?: Product;
}

export interface CartWithItems extends Cart {
  cart_items: CartItem[];
}

export interface Order {
  id: string;
  user_id: string;
  total_price: number;
  status: "pending" | "paid" | "selesai" | "cancelled" | "expired";
  midtrans_order_id: string | null;
  payment_url: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number; // locked price at time of purchase
  // Joined
  product?: Product;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

// ─── UI Types ──────────────────────────────────────────────────────────────

export type ProductCategory = "Semua" | "Kukus" | "Goreng" | "Frozen" | "Minuman";

export interface CategoryOption {
  label: string;
  value: string; // '' means 'all'
}
