"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import Link from "next/link";
import type { Order } from "@/types";

type FilterStatus = "all" | Order["status"];

const STATUS_FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "Semua", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Dibayar", value: "paid" },
  { label: "Selesai", value: "selesai" },
  { label: "Dibatalkan", value: "cancelled" },
  { label: "Kadaluarsa", value: "expired" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }, [supabase, filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function markAsSelesai(orderId: string) {
    setUpdatingId(orderId);
    await supabase
      .from("orders")
      .update({ status: "selesai" })
      .eq("id", orderId);

    // Update local state
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "selesai" as const } : o))
    );
    setUpdatingId(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Manajemen Pesanan</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {orders.length} pesanan ditampilkan
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 border border-gray-700 hover:border-emerald-500/40 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
              filter === value
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-600"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gray-500" size={32} />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-semibold">Tidak ada pesanan</p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3 border-b border-gray-800 text-gray-500 text-xs font-semibold uppercase tracking-wide">
            <span>ID Pesanan</span>
            <span>Tanggal</span>
            <span>Total</span>
            <span>Status</span>
            <span>Aksi</span>
          </div>

          <div className="divide-y divide-gray-800">
            {orders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3.5"
              >
                {/* Order ID */}
                <div>
                  <Link href={`/admin/orders/${order.id}`} className="text-white hover:text-emerald-400 font-mono text-sm font-semibold transition-colors">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </Link>
                  {order.midtrans_order_id && (
                    <p className="text-gray-600 text-xs truncate">
                      {order.midtrans_order_id}
                    </p>
                  )}
                </div>

                {/* Date */}
                <span className="text-gray-400 text-xs whitespace-nowrap">
                  {new Date(order.created_at).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>

                {/* Total */}
                <span className="text-white font-bold text-sm">
                  {formatPrice(order.total_price)}
                </span>

                {/* Status badge */}
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    ORDER_STATUS_COLORS[order.status] ?? "bg-gray-800 text-gray-400"
                  }`}
                >
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>

                {/* Action: Mark as Selesai */}
                <div>
                  {order.status === "paid" ? (
                    <button
                      onClick={() => markAsSelesai(order.id)}
                      disabled={updatingId === order.id}
                      className="flex items-center gap-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                    >
                      {updatingId === order.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}
                      Selesai
                    </button>
                  ) : (
                    <span className="text-gray-700 text-xs">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
