"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Loader2, MapPin, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, getProductImageUrl } from "@/lib/utils";
import type { CartItem, Product } from "@/types";
import NavbarCart from "@/components/navbar-cart";

interface CartItemWithProduct extends CartItem { product: Product; }

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const fetchCart = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).single();
    if (!cart) { setLoading(false); return; }
    const { data } = await supabase.from("cart_items").select("*, product:products(*)").eq("cart_id", cart.id);
    setItems((data as CartItemWithProduct[]) ?? []);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = 15000;
  const total = subtotal + shipping;

  async function handlePlaceOrder() {
    setProcessing(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Silakan masuk terlebih dahulu.");
      if (items.length === 0) throw new Error("Keranjang kosong.");
      const { data: order, error: orderError } = await supabase.from("orders").insert({ user_id: user.id, total_price: total, status: "pending" }).select().single();
      if (orderError || !order) throw new Error("Gagal membuat pesanan.");
      const orderItems = items.map((item) => ({ order_id: order.id, product_id: item.product.id, quantity: item.quantity, price: item.product.price }));
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw new Error("Gagal menyimpan item pesanan.");
      const { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).single();
      if (cart) { await supabase.from("cart_items").delete().eq("cart_id", cart.id); }
      const response = await fetch("/api/midtrans/charge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: order.id, user_email: user.email }) });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error || "Gagal membuat transaksi pembayaran."); }
      const { payment_url } = await response.json();
      window.location.href = payment_url;
    } catch (err) {
      setError((err as Error).message);
      setProcessing(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  if (items.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 text-center p-4">
        <div className="text-5xl">🛒</div>
        <h2 className="font-bold text-text-main">Keranjang kamu kosong</h2>
        <Link href="/" className="text-primary font-semibold hover:underline">Kembali ke Menu</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/cart" className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors duration-200 text-sm font-medium">
              <ArrowLeft size={16} /> Kembali
            </Link>
            <span className="font-extrabold text-text-main text-lg">Konfirmasi Pesanan</span>
          </div>
          <NavbarCart />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <h2 className="font-extrabold text-text-main text-xl">🧾 Detail Pesanan</h2>
            <div className="bg-white rounded-2xl border border-border-soft divide-y divide-border-soft">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 items-center">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-cream shrink-0">
                    <Image src={getProductImageUrl(item.product.image_url)} alt={item.product.name} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-main text-sm line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-text-muted">{item.quantity} x {formatPrice(item.product.price)}</p>
                  </div>
                  <span className="font-bold text-text-main text-sm shrink-0">{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 bg-primary-light/50 rounded-2xl p-4">
              <MapPin className="text-primary shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-primary-dark">Pengiriman ke alamat terdaftar</p>
                <p className="text-xs text-primary mt-0.5">Pastikan alamat pengiriman sudah benar sebelum membayar.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-extrabold text-text-main text-xl mb-4">💳 Ringkasan Pembayaran</h2>
            <div className="bg-white rounded-2xl border border-border-soft p-6 sticky top-24">
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between text-text-muted"><span>Subtotal</span><span className="font-semibold text-text-main">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-text-muted"><span>Ongkos Kirim</span><span className="font-semibold text-text-main">{formatPrice(shipping)}</span></div>
                <div className="border-t border-dashed border-border-soft my-1" />
                <div className="flex justify-between text-text-main font-extrabold text-lg"><span>Total Bayar</span><span className="text-accent">{formatPrice(total)}</span></div>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl mt-4">{error}</div>}
              <button onClick={handlePlaceOrder} disabled={processing} className="w-full mt-6 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0">
                {processing ? <><Loader2 size={18} className="animate-spin" />Memproses...</> : <><CreditCard size={18} />Bayar Sekarang</>}
              </button>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-text-muted">
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-primary" />SSL Aman</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-primary" />Via Midtrans</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-primary" />Terenkripsi</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
