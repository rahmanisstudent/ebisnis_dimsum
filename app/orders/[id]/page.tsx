import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, getProductImageUrl } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import type { OrderWithItems } from "@/types";
import { ArrowLeft, Package, ChefHat } from "lucide-react";
import NavbarCart from "@/components/navbar-cart";
import OrderItemReview from "@/components/order-item-review";
import SharedFooter from "@/components/shared-footer";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, order_items(*, product:products(*))")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !order) notFound();

  const o = order as OrderWithItems;
  const statusColor = ORDER_STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600";
  const statusLabel = ORDER_STATUS_LABELS[o.status] ?? o.status;
  const subtotal = o.order_items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = o.shipping_cost ?? 0;
  const discountAmount = o.discount_amount ?? 0;

  return (
    <div className="min-h-screen" style={{ background: "#fdf6f0" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #f0e8e4", boxShadow: "0 1px 8px rgba(180,60,40,0.06)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", height: "62px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/orders" className="flex items-center gap-2 text-text-muted hover:text-primary text-sm font-medium transition-colors duration-200">
            <ArrowLeft size={16} /> Pesanan Saya
          </Link>
          <NavbarCart />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <p className="text-xs text-text-muted font-mono mb-1">Pesanan #{o.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-sm text-text-muted">
              {new Date(o.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusColor}`}>{statusLabel}</span>
        </div>

        <div className="bg-white rounded-2xl border border-border-soft mb-4">
          <div className="p-4 border-b border-border-soft">
            <h2 className="font-extrabold text-text-main flex items-center gap-2">
              <Package size={16} className="text-primary" /> Item Pesanan
            </h2>
          </div>
          <div className="divide-y divide-border-soft">
            {o.order_items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 items-center">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-cream shrink-0">
                  {item.product && (
                    <Image src={getProductImageUrl(item.product.image_url)} alt={item.product.name} fill sizes="56px" className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-main text-sm">
                    {item.product?.name ?? "Produk"}
                    {item.variant_name && (
                      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-primary-light text-primary-dark border border-primary/20">
                        {item.variant_name}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted">{item.quantity} x {formatPrice(item.price)}</p>
                  {o.status === "selesai" && item.product_id && (
                    <OrderItemReview
                      productId={item.product_id}
                      userId={user.id}
                      orderId={o.id}
                    />
                  )}
                </div>
                <span className="font-bold text-text-main text-sm">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border-soft p-5">
          <h2 className="font-extrabold text-text-main mb-4">Rincian Pembayaran</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-text-muted"><span>Subtotal</span><span className="text-text-main">{formatPrice(subtotal)}</span></div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600 font-medium"><span>Potongan Voucher</span><span>-{formatPrice(discountAmount)}</span></div>
            )}
            <div className="flex justify-between text-text-muted"><span>Ongkos Kirim</span><span className="text-text-main">{formatPrice(shippingCost)}</span></div>
            <div className="border-t border-dashed border-border-soft my-1" />
            <div className="flex justify-between font-extrabold text-text-main text-base"><span>Total</span><span className="text-accent">{formatPrice(o.total_price)}</span></div>
          </div>

          {o.status === "pending" && o.payment_url && (
            <a href={o.payment_url} className="w-full mt-5 flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20">
              Bayar Sekarang
            </a>
          )}
        </div>

        {/* WhatsApp Customer Service Support */}
        <div className="mt-4">
          <a
            href={`https://wa.me/6287885559642?text=${encodeURIComponent(`Halo Admin DimsumStore, saya ingin bertanya tentang pesanan saya #DS-${o.id.slice(0, 8).toUpperCase()}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold py-3.5 rounded-2xl transition-all duration-300 shadow-lg shadow-green-500/10 text-sm"
          >
            Hubungi CS via WhatsApp
          </a>
        </div>
      </main>
      <SharedFooter />
    </div>
  );
}
