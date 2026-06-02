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

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  district: string | null;
  sub_district: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price_adjustment: number;
  stock: number;
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
  variant_id: string | null;
  created_at: string;
  // Joined
  product?: Product;
  variant?: ProductVariant;
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
  shipping_cost: number;
  shipping_address: string | null;
  voucher_id: string | null;
  discount_amount: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number; // locked price at time of purchase
  variant_id: string | null;
  variant_name: string | null;
  // Joined
  product?: Product;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export interface Voucher {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  // Joined
  user?: { email: string };
}

// ─── UI Types ──────────────────────────────────────────────────────────────

export type ProductCategory = string;

export interface CategoryOption {
  label: string;
  value: string; // '' means 'all'
}
