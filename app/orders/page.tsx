import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, getProductImageUrl } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import type { OrderWithItems } from "@/types";
import {
  Package,
  ChefHat,
  ChevronRight,
  ShoppingBag,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import NavbarCart from "@/components/navbar-cart";
import SharedFooter from "@/components/shared-footer";

interface OrdersPageProps {
  searchParams: Promise<{ transaction_status?: string; order_id?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { transaction_status } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ordersData, error } = await supabase
    .from("orders")
    .select("*, order_items(*, product:products(name, image_url))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Orders] Failed to fetch orders:", error);
  }

  const orders = (ordersData as OrderWithItems[]) ?? [];

  return (
    <div className="min-h-screen" style={{ background: "#fdf6f0" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #f0e8e4", boxShadow: "0 1px 8px rgba(180,60,40,0.06)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", height: "62px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <ChefHat size={22} color="#c0392b" strokeWidth={2.5} />
            <span style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.4px" }}>
              <span style={{ color: "#c0392b" }}>Dimsum</span>
              <span style={{ color: "#2d2a26" }}>Store</span>
            </span>
          </a>
          <NavbarCart />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner notifikasi dari Midtrans redirect */}
        {transaction_status === "pending" && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm font-semibold px-4 py-3 rounded-2xl flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            Pembayaran sedang menunggu konfirmasi. Selesaikan pembayaran sebelum
            batas waktu.
          </div>
        )}
        {transaction_status === "settlement" ||
        transaction_status === "capture" ? (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 text-sm font-semibold px-4 py-3 rounded-2xl flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            Pembayaran berhasil! Pesanan kamu sedang diproses.
          </div>
        ) : null}

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-text-main flex items-center gap-2">
            <ShoppingBag size={22} className="text-primary" />
            Riwayat Pesanan
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {orders.length > 0
              ? `${orders.length} pesanan ditemukan`
              : "Belum ada pesanan"}
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div style={{ width: 80, height: 80, background: "#fef2f2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem" }}>
              <Package size={36} color="#c0392b" />
            </div>
            <p className="font-extrabold text-text-main text-lg">
              Belum ada pesanan
            </p>
            <p className="text-sm text-text-muted max-w-xs">
              Yuk, mulai pesan dimsum favoritmu sekarang!
            </p>
            <Link
              href="/"
              className="mt-2 bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-2xl transition-all duration-300 text-sm shadow-lg shadow-primary/20"
            >
              Lihat Menu
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const statusColor =
                ORDER_STATUS_COLORS[order.status] ??
                "bg-gray-100 text-gray-600";
              const statusLabel =
                ORDER_STATUS_LABELS[order.status] ?? order.status;
              const firstItem = order.order_items?.[0];
              const extraCount = (order.order_items?.length ?? 1) - 1;

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="bg-white rounded-2xl border border-border-soft p-4 flex items-center gap-4 hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-cream shrink-0">
                    {firstItem?.product?.image_url ? (
                      <Image
                        src={getProductImageUrl(firstItem.product.image_url)}
                        alt={firstItem.product.name ?? ""}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={20} className="text-text-muted" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-mono text-text-muted">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="font-semibold text-text-main text-sm truncate">
                      {firstItem?.product?.name ?? "Pesanan"}
                      {extraCount > 0 && (
                        <span className="text-text-muted font-normal">
                          {" "}
                          +{extraCount} item lainnya
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-extrabold text-accent text-sm">
                        {formatPrice(order.total_price)}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-text-muted">
                        <Clock size={10} />
                        {new Date(order.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    size={16}
                    className="text-text-muted group-hover:text-primary transition-colors shrink-0"
                  />
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <SharedFooter />
    </div>
  );
}
