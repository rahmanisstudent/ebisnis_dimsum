import { createClient } from "@/lib/supabase/server";
import { ShoppingBag, Package, TrendingUp, Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch stats in parallel
  const [
    { count: totalOrders },
    { count: pendingOrders },
    { count: totalProducts },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("total_price")
      .in("status", ["paid", "selesai"]),
  ]);

  const totalRevenue = revenueData?.reduce(
    (sum, o) => sum + (o.total_price ?? 0),
    0
  ) ?? 0;

  const stats = [
    {
      label: "Total Pesanan",
      value: totalOrders ?? 0,
      icon: ShoppingBag,
      color: "bg-blue-500/10 text-blue-400",
      border: "border-blue-500/20",
    },
    {
      label: "Menunggu Pembayaran",
      value: pendingOrders ?? 0,
      icon: Clock,
      color: "bg-amber-500/10 text-amber-400",
      border: "border-amber-500/20",
    },
    {
      label: "Total Produk",
      value: totalProducts ?? 0,
      icon: Package,
      color: "bg-emerald-500/10 text-emerald-400",
      border: "border-emerald-500/20",
    },
    {
      label: "Total Pendapatan",
      value: formatPrice(totalRevenue),
      icon: TrendingUp,
      color: "bg-green-500/10 text-green-400",
      border: "border-green-500/20",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Selamat datang kembali, Admin 👋
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, border }) => (
          <div
            key={label}
            className={`bg-gray-900 rounded-2xl border ${border} p-5 flex flex-col gap-3`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium">{label}</p>
              <p className="text-white font-extrabold text-xl mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="/admin/products"
          className="bg-gray-900 border border-gray-800 hover:border-emerald-500/40 rounded-2xl p-6 flex items-center gap-4 transition-all group"
        >
          <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600/20 transition-colors">
            <Package className="text-emerald-400" size={22} />
          </div>
          <div>
            <p className="text-white font-bold">Kelola Produk</p>
            <p className="text-gray-500 text-sm">Tambah, edit, atau hapus produk</p>
          </div>
        </a>
        <a
          href="/admin/orders"
          className="bg-gray-900 border border-gray-800 hover:border-blue-500/40 rounded-2xl p-6 flex items-center gap-4 transition-all group"
        >
          <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
            <ShoppingBag className="text-blue-400" size={22} />
          </div>
          <div>
            <p className="text-white font-bold">Kelola Pesanan</p>
            <p className="text-gray-500 text-sm">Lihat dan perbarui status pesanan</p>
          </div>
        </a>
      </div>
    </div>
  );
}
