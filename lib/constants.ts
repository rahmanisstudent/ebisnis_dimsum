import type { Product, CategoryOption } from "@/types";

/** Product categories — now just the fallback; prefer DB-driven categories */
export const CATEGORIES: CategoryOption[] = [
  { label: "Semua", value: "" },
  { label: "🥟 Kukus", value: "Kukus" },
  { label: "🍳 Goreng", value: "Goreng" },
  { label: "❄️ Frozen", value: "Frozen" },
  { label: "🥤 Minuman", value: "Minuman" },
];

/** Human-readable labels for each order status */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu Pembayaran",
  paid: "Dibayar",
  selesai: "Selesai",
  cancelled: "Dibatalkan",
  expired: "Kadaluarsa",
};

/** Tailwind color classes for each order status badge */
export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  selesai: "bg-sky-50 text-sky-700",
  cancelled: "bg-red-50 text-red-600",
  expired: "bg-gray-100 text-gray-500",
};

/** Store location (Yogyakarta) for shipping calculation */
export const STORE_LOCATION = {
  latitude: -7.7956,
  longitude: 110.3695,
  address: "Yogyakarta",
};

/** Shipping rate per km in IDR */
export const SHIPPING_RATE_PER_KM = 2500;
export const SHIPPING_MIN_COST = 8000;
export const SHIPPING_MAX_COST = 50000;
