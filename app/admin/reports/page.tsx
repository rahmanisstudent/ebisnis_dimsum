"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart3, Download, Loader2, Calendar, TrendingUp, ShoppingBag, Package, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

interface OrderReport {
  id: string;
  created_at: string;
  user_id: string;
  status: string;
  shipping_cost: number;
  discount_amount: number;
  total_price: number;
  shipping_address: string;
  order_items: {
    product_id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
    } | null;
  }[];
}

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<OrderReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7" | "30" | "all">("30");
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("orders")
      .select("*, order_items(*, product:products(name))")
      .order("created_at", { ascending: false });

    if (dateRange !== "all") {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange, 10));
      query = query.gte("created_at", cutoffDate.toISOString());
    }

    const { data, error: fetchErr } = await query;

    if (fetchErr) {
      setError(fetchErr.message);
    } else {
      setOrders((data as any[]) ?? []);
    }
    setLoading(false);
  }, [dateRange, supabase]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Calculations
  const completedOrders = orders.filter((o) => o.status === "selesai" || o.status === "paid");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_price, 0);
  const totalShipping = completedOrders.reduce((sum, o) => sum + o.shipping_cost, 0);
  const totalDiscounts = completedOrders.reduce((sum, o) => sum + (o.discount_amount ?? 0), 0);
  const netRevenue = Math.max(0, totalRevenue - totalShipping);

  // Top Products calculation
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  completedOrders.forEach((o) => {
    o.order_items.forEach((item) => {
      const prodName = item.product?.name ?? "Produk Terhapus";
      const key = item.product_id || prodName;
      if (!productSales[key]) {
        productSales[key] = { name: prodName, quantity: 0, revenue: 0 };
      }
      productSales[key].quantity += item.quantity;
      productSales[key].revenue += item.price * item.quantity;
    });
  });

  const sortedProducts = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);
  const totalItemsSold = Object.values(productSales).reduce((sum, p) => sum + p.quantity, 0);

  // Status breakdown
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  function triggerCSVExport() {
    if (orders.length === 0) return;

    const headers = [
      "Order ID",
      "Tanggal",
      "User ID",
      "Status",
      "Subtotal Produk",
      "Ongkos Kirim",
      "Potongan Diskon",
      "Total Bayar",
      "Alamat Pengiriman"
    ];

    const rows = orders.map((o) => {
      const productSubtotal = o.total_price - o.shipping_cost + (o.discount_amount ?? 0);
      return [
        o.id,
        new Date(o.created_at).toLocaleString("id-ID"),
        o.user_id,
        o.status,
        productSubtotal,
        o.shipping_cost,
        o.discount_amount ?? 0,
        o.total_price,
        `"${(o.shipping_address || "").replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_penjualan_dimsum_${dateRange === "all" ? "semua" : `${dateRange}_hari`}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const statCardClass = "bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3 shadow-md";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="text-emerald-500" size={30} />
            Laporan Penjualan
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Analisis performa bisnis toko dimsum Anda</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-850 px-3 py-2 rounded-xl">
            <Calendar className="text-gray-500" size={16} />
            <select
              value={dateRange}
              onChange={(e: any) => setDateRange(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="7" className="bg-gray-900 text-white">7 Hari Terakhir</option>
              <option value="30" className="bg-gray-900 text-white">30 Hari Terakhir</option>
              <option value="all" className="bg-gray-900 text-white">Semua Waktu</option>
            </select>
          </div>

          <button
            onClick={triggerCSVExport}
            disabled={orders.length === 0}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-850 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
          >
            <Download size={14} />
            Ekspor CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-2xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin text-emerald-500" size={40} />
          <p className="text-gray-500 font-medium animate-pulse">Menyusun laporan...</p>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={statCardClass}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium">Pendapatan Kotor</p>
                <p className="text-white font-black text-2xl mt-0.5">{formatPrice(totalRevenue)}</p>
              </div>
            </div>

            <div className={statCardClass}>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium">Pendapatan Bersih (Excl. Ongkir)</p>
                <p className="text-white font-black text-2xl mt-0.5">{formatPrice(netRevenue)}</p>
              </div>
            </div>

            <div className={statCardClass}>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium">Pesanan Selesai</p>
                <p className="text-white font-black text-2xl mt-0.5">{completedOrders.length}</p>
              </div>
            </div>

            <div className={statCardClass}>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Package size={20} />
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium">Item Dimsum Terjual</p>
                <p className="text-white font-black text-2xl mt-0.5">{totalItemsSold} Pcs</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Top Products */}
            <div className="md:col-span-8 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-850">
                <h3 className="text-white font-bold text-sm">Produk Terlaris</h3>
              </div>
              {sortedProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">Belum ada data penjualan produk</div>
              ) : (
                <div className="divide-y divide-gray-850">
                  {sortedProducts.map((p, idx) => (
                    <div key={idx} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-950/20">
                      <div>
                        <p className="text-white text-sm font-semibold">{p.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{p.quantity} Pcs Terjual</p>
                      </div>
                      <span className="text-emerald-400 font-bold text-sm">{formatPrice(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Breakdown & Discount Stats */}
            <div className="md:col-span-4 flex flex-col gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
                <h3 className="text-white font-bold text-sm mb-4">Status Pesanan</h3>
                <div className="flex flex-col gap-3">
                  {["pending", "paid", "selesai", "cancelled", "expired"].map((status) => {
                    const count = statusCounts[status] || 0;
                    return (
                      <div key={status} className="flex justify-between items-center text-xs py-1.5 border-b border-gray-850 last:border-0">
                        <span className="text-gray-400 uppercase font-semibold tracking-wider">{status}</span>
                        <span className="bg-gray-800 text-white font-bold px-2 py-0.5 rounded-full">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
                <h3 className="text-white font-bold text-sm mb-4">Subsidi Promo</h3>
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-400">Total Potongan Diskon</span>
                    <span className="text-red-400 font-bold">{formatPrice(totalDiscounts)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-400">Total Pendapatan Ongkir</span>
                    <span className="text-blue-400 font-bold">{formatPrice(totalShipping)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
