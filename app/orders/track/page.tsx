"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NavbarCart from "@/components/navbar-cart";
import { Search, Package, MapPin, Ticket, CreditCard, ChevronRight, HelpCircle, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [orderIdInput, setOrderIdInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch if query parameters are present
  useEffect(() => {
    const qOrderId = searchParams.get("order_id");
    const qEmail = searchParams.get("email");

    if (qOrderId && qEmail) {
      setOrderIdInput(qOrderId);
      setEmailInput(qEmail);
      handleTrack(qOrderId, qEmail);
    }
  }, [searchParams]);

  async function handleTrack(targetId: string, targetEmail: string) {
    if (!targetId || !targetEmail) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: targetId, email: targetEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal memuat pesanan");
      } else {
        setOrder(data.order);
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdInput.trim() || !emailInput.trim()) return;

    // Update query params to allow bookmarking/sharing link
    const params = new URLSearchParams();
    params.set("order_id", orderIdInput.trim());
    params.set("email", emailInput.trim());
    router.replace(`/orders/track?${params.toString()}`);
    handleTrack(orderIdInput.trim(), emailInput.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <span className="text-2xl">🥟</span>
            <span className="font-extrabold text-xl tracking-tight">
              <span className="text-primary">DimSum</span>
              <span className="text-accent">Store</span>
            </span>
          </a>
          <NavbarCart />
        </div>
      </header>

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-main">
            Lacak Pesanan Anda
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Masukkan ID Pesanan dan email Anda untuk melacak status pesanan Anda.
          </p>
        </div>

        {/* Tracking Form */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full flex flex-col gap-1.5">
              <label htmlFor="orderId" className="text-xs font-bold text-text-main">
                ID Pesanan / Nomor Order
              </label>
              <input
                id="orderId"
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="Contoh: DS-xxxxxx"
                required
                className="w-full text-sm px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary transition"
              />
            </div>

            <div className="flex-1 w-full flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-bold text-text-main">
                Email Pembelian
              </label>
              <input
                id="email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full text-sm px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-primary hover:bg-primary-dark text-white text-sm font-bold h-[46px] px-8 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-75"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Lacak
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 text-sm font-semibold rounded-2xl flex items-center gap-2 border border-red-100">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Order Details Result */}
        {order && (
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6 animate-scale-in">
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
              <div>
                <p className="text-xs font-bold text-text-muted">Nomor Pesanan</p>
                <h2 className="text-lg font-black text-text-main">DS-{order.id.slice(0, 8)}...</h2>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-extrabold ${ORDER_STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-text-main flex items-center gap-1.5 mb-2">
                  <MapPin size={16} className="text-primary" />
                  Alamat Pengiriman
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  {order.user_id ? "Pembelian Terdaftar" : (
                    <>
                      <strong>Penerima:</strong> {order.guest_name}<br />
                      <strong>Telepon:</strong> {order.guest_phone}<br />
                    </>
                  )}
                  <strong>Alamat:</strong> {order.shipping_address}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-text-main flex items-center gap-1.5 mb-2">
                  <CreditCard size={16} className="text-primary" />
                  Informasi Pembayaran
                </h3>
                {order.status === "pending" && order.payment_url ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-text-muted">
                      Pesanan Anda sudah dibuat. Mohon selesaikan pembayaran agar pesanan dapat segera diproses.
                    </p>
                    <a
                      href={order.payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-dark text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition"
                    >
                      Bayar Sekarang (Midtrans)
                      <ChevronRight size={14} />
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">
                    Status Pembayaran: <strong>{order.status === "paid" || order.status === "selesai" ? "Lunas" : "Tidak Dibayar"}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-sm font-bold text-text-main flex items-center gap-1.5 mb-3">
                <Package size={16} className="text-primary" />
                Daftar Item
              </h3>
              <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="p-4 flex justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-text-main">
                        {item.product?.name ?? "Produk"}
                      </p>
                      {item.variant_name && (
                        <p className="text-[11px] text-[#4A7C59] font-semibold">
                          Varian: {item.variant_name}
                        </p>
                      )}
                      <p className="text-xs text-text-muted mt-0.5">
                        {item.quantity} x {formatPrice(item.price)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-text-main">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Pricing Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-2 border border-gray-100 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Subtotal Produk</span>
                <span className="font-semibold text-text-main">
                  {formatPrice(
                    order.order_items.reduce(
                      (acc: number, item: any) => acc + item.price * item.quantity,
                      0
                    )
                  )}
                </span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1">
                    <Ticket size={12} />
                    Diskon Voucher
                  </span>
                  <span>-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-muted">Ongkos Kirim</span>
                <span>{formatPrice(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-text-main pt-2 border-t border-gray-200 mt-1">
                <span>Total Tagihan</span>
                <span className="text-accent">{formatPrice(order.total_price)}</span>
              </div>
            </div>

            {/* WhatsApp Contact CS Support */}
            <div className="text-center pt-2">
              <a
                href={`https://wa.me/6287885559642?text=Halo%20Admin%20DimsumStore,%20saya%20ingin%20bertanya%20mengenai%20pesanan%20saya%20%23DS-${order.id.slice(0, 8)}...`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-[#25D366] hover:text-[#20BA5A] font-bold transition"
              >
                <HelpCircle size={14} />
                Butuh bantuan? Hubungi CS via WhatsApp
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw size={24} className="text-primary animate-spin" />
          <span className="text-sm text-text-muted font-medium">Memuat halaman pelacakan...</span>
        </div>
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}
