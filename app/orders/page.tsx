import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import type { Order } from "@/types";
import { Package, ArrowRight } from "lucide-react";
import NavbarCart from "@/components/navbar-cart";

export const metadata = {
  title: "Pesanan Saya",
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orderList = (orders as Order[]) ?? [];

  return (
    <div className="min-h-screen">
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-2xl">🥟</span>
            <span className="font-extrabold text-xl tracking-tight">
              <span className="text-primary">DimSum</span><span className="text-accent">Store</span>
            </span>
          </Link>
          <NavbarCart />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-text-main mb-8">
          🧾 Riwayat Pesanan
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl mb-6">
            Gagal memuat pesanan: {error.message}
          </div>
        )}

        {orderList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-primary-light rounded-full flex items-center justify-center mb-6">
              <Package className="text-primary" size={40} />
            </div>
            <h2 className="text-xl font-bold text-text-main mb-2">Belum ada pesanan</h2>
            <p className="text-text-muted text-sm mb-8">Yuk, mulai pesan dimsum pertamamu!</p>
            <Link href="/" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20">
              Lihat Menu
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orderList.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-border-soft p-5 flex items-center justify-between gap-4 hover:shadow-md hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="flex flex-col gap-2 min-w-0">
                  <p className="text-xs text-text-muted font-mono truncate">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-sm text-text-muted">
                    {new Date(order.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="font-extrabold text-text-main text-base">
                    {formatPrice(order.total_price)}
                  </p>
                  <span
                    className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full w-fit ${
                      ORDER_STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>

                <div className="flex flex-col gap-2 shrink-0 items-end">
                  {order.status === "pending" && order.payment_url && (
                    <a
                      href={order.payment_url}
                      className="bg-accent hover:bg-accent/90 text-white text-xs font-bold px-4 py-2 rounded-2xl transition-all duration-300"
                    >
                      Bayar Sekarang
                    </a>
                  )}
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-primary font-semibold transition-colors duration-200"
                  >
                    Detail <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-warm-dark text-white/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥟</span>
            <span className="font-extrabold text-white">DimSum<span className="text-accent">Store</span></span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} DimsumStore. Semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
