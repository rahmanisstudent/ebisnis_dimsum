import type { CategoryOption } from "@/types";

/** Product categories used for the filter tabs on the catalog page */
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
