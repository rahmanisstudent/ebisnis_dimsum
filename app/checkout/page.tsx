"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  MapPin,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  formatPrice,
  getProductImageUrl,
  calculateShippingCost,
} from "@/lib/utils";
import type { CartItem, Product, UserProfile, Voucher } from "@/types";
import NavbarCart from "@/components/navbar-cart";

interface CartItemWithProduct extends CartItem {
  product: Product;
}

function CheckoutContent() {
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    district: "",
    sub_district: "",
  });

  // Voucher state
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Stabilize item IDs as a string to avoid re-render loop
  const itemsParam = searchParams.get("items") ?? "";

  const fetchData = useCallback(async () => {
    // Parse inside callback so it doesn't cause dependency instability
    const selectedItemIds = itemsParam.split(",").filter(Boolean);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (profileData) {
      setProfile(profileData as UserProfile);
      setAddressForm({
        full_name: profileData.full_name ?? "",
        phone: profileData.phone ?? "",
        address: profileData.address ?? "",
        district: profileData.district ?? "",
        sub_district: profileData.sub_district ?? "",
      });
    }

    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!cart) {
      setLoading(false);
      return;
    }

    let query = supabase
      .from("cart_items")
      .select("*, product:products(*), variant:product_variants(*)")
      .eq("cart_id", cart.id);

    // Filter hanya item yang dipilih dari keranjang
    if (selectedItemIds.length > 0) {
      query = query.in("id", selectedItemIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Checkout] Fetch error:", error.message);
    }

    setItems((data as CartItemWithProduct[]) ?? []);
    setLoading(false);
  }, [supabase, router, itemsParam]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const subtotal = items.reduce((sum, item) => {
    const itemPrice =
      item.product.price + (item.variant?.price_adjustment ?? 0);
    return sum + itemPrice * item.quantity;
  }, 0);

  // Voucher discount calculation
  let discountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discount_type === "percentage") {
      const calculatedPotongan = Math.round(
        subtotal * (appliedVoucher.discount_value / 100),
      );
      discountAmount = appliedVoucher.max_discount
        ? Math.min(calculatedPotongan, appliedVoucher.max_discount)
        : calculatedPotongan;
    } else {
      discountAmount = Math.min(appliedVoucher.discount_value, subtotal);
    }
  }

  const { cost: shipping, distance } = calculateShippingCost(
    addressForm.sub_district,
    addressForm.district,
    profile?.latitude,
    profile?.longitude,
  );
  const total = Math.max(0, subtotal - discountAmount + shipping);

  async function handleApplyVoucher() {
    if (!voucherCodeInput.trim()) return;

    setCheckingVoucher(true);
    setVoucherError(null);
    try {
      const { data: voucher, error: vError } = await supabase
        .from("vouchers")
        .select("*")
        .eq("code", voucherCodeInput.trim().toUpperCase())
        .single();

      if (vError || !voucher) {
        throw new Error("Voucher tidak ditemukan.");
      }

      const v = voucher as Voucher;

      if (!v.active) {
        throw new Error("Voucher tidak aktif.");
      }

      if (v.expiry_date && new Date(v.expiry_date) < new Date()) {
        throw new Error("Voucher telah kedaluwarsa.");
      }

      if (subtotal < v.min_purchase) {
        throw new Error(
          `Minimal pembelian untuk voucher ini adalah ${formatPrice(v.min_purchase)}.`,
        );
      }

      setAppliedVoucher(v);
      setVoucherCodeInput("");
    } catch (err) {
      setVoucherError((err as Error).message);
      setAppliedVoucher(null);
    } finally {
      setCheckingVoucher(false);
    }
  }

  function handleRemoveVoucher() {
    setAppliedVoucher(null);
    setVoucherError(null);
  }

  const shippingAddressText = [
    addressForm.full_name,
    addressForm.phone,
    addressForm.address,
    addressForm.sub_district,
    addressForm.district,
    "Yogyakarta",
  ]
    .filter(Boolean)
    .join(", ");

  async function handlePlaceOrder() {
    setProcessing(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Silakan masuk terlebih dahulu.");
      if (items.length === 0) throw new Error("Keranjang kosong.");

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_price: total,
          status: "pending",
          shipping_cost: shipping,
          shipping_address: shippingAddressText || null,
          voucher_id: appliedVoucher?.id || null,
          discount_amount: discountAmount,
        })
        .select()
        .single();

      if (orderError || !order) throw new Error("Gagal membuat pesanan.");

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price + (item.variant?.price_adjustment ?? 0),
        variant_id: item.variant_id ?? null,
        variant_name: item.variant?.name ?? null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      if (itemsError) throw new Error("Gagal menyimpan item pesanan.");

      // Delete only checked-out items from cart (S01 fix)
      const itemIds = items.map((i) => i.id);
      await supabase.from("cart_items").delete().in("id", itemIds);

      const response = await fetch("/api/midtrans/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id, user_email: user.email }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Gagal membuat transaksi pembayaran.");
      }
      const { payment_url } = await response.json();
      window.location.href = payment_url;
    } catch (err) {
      setError((err as Error).message);
      setProcessing(false);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );

  if (items.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 text-center p-4">
        <div className="text-5xl">🛒</div>
        <h2 className="font-bold text-text-main">
          Tidak ada item untuk di-checkout
        </h2>
        <Link
          href="/cart"
          className="text-primary font-semibold hover:underline"
        >
          Kembali ke Keranjang
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors duration-200 text-sm font-medium"
            >
              <ArrowLeft size={16} /> Kembali
            </Link>
            <span className="font-extrabold text-text-main text-lg">
              Konfirmasi Pesanan
            </span>
          </div>
          <NavbarCart />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            {/* Shipping Address Section */}
            <h2 className="font-extrabold text-text-main text-xl">
              📍 Alamat Pengiriman
            </h2>
            <div className="bg-white rounded-2xl border border-border-soft p-5">
              {editingAddress ? (
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Nama penerima"
                    value={addressForm.full_name}
                    onChange={(e) =>
                      setAddressForm((f) => ({
                        ...f,
                        full_name: e.target.value,
                      }))
                    }
                    className="w-full border border-border-soft rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <input
                    type="tel"
                    placeholder="Nomor telepon"
                    value={addressForm.phone}
                    onChange={(e) =>
                      setAddressForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="w-full border border-border-soft rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <textarea
                    placeholder="Alamat lengkap"
                    value={addressForm.address}
                    onChange={(e) =>
                      setAddressForm((f) => ({ ...f, address: e.target.value }))
                    }
                    rows={2}
                    className="w-full border border-border-soft rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Kelurahan"
                      value={addressForm.sub_district}
                      onChange={(e) =>
                        setAddressForm((f) => ({
                          ...f,
                          sub_district: e.target.value,
                        }))
                      }
                      className="w-full border border-border-soft rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Kecamatan"
                      value={addressForm.district}
                      onChange={(e) =>
                        setAddressForm((f) => ({
                          ...f,
                          district: e.target.value,
                        }))
                      }
                      className="w-full border border-border-soft rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <button
                    onClick={() => setEditingAddress(false)}
                    className="bg-primary hover:bg-primary-dark text-white text-sm font-bold py-2.5 px-4 rounded-xl transition-all"
                  >
                    Simpan Alamat
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <MapPin
                      className="text-primary shrink-0 mt-0.5"
                      size={18}
                    />
                    <div>
                      {shippingAddressText ? (
                        <>
                          <p className="text-sm font-semibold text-text-main">
                            {addressForm.full_name || "Nama belum diisi"}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {addressForm.phone}
                          </p>
                          <p className="text-xs text-text-muted mt-1">
                            {addressForm.address}, {addressForm.sub_district},{" "}
                            {addressForm.district}, Yogyakarta
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-red-500 font-medium">
                          Alamat belum diisi. Klik edit untuk mengisi alamat
                          pengiriman.
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingAddress(true)}
                    className="text-primary hover:text-primary-dark transition-colors shrink-0"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Order Items */}
            <h2 className="font-extrabold text-text-main text-xl mt-2">
              🧾 Detail Pesanan
            </h2>
            <div className="bg-white rounded-2xl border border-border-soft divide-y divide-border-soft">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 items-center">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-cream shrink-0">
                    <Image
                      src={getProductImageUrl(item.product.image_url)}
                      alt={item.product.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-main text-sm line-clamp-1">
                      {item.product.name}
                      {item.variant && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-primary-light text-primary-dark border border-primary/20">
                          {item.variant.name}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-text-muted">
                      {item.quantity} x{" "}
                      {formatPrice(
                        item.product.price +
                          (item.variant?.price_adjustment ?? 0),
                      )}
                    </p>
                  </div>
                  <span className="font-bold text-text-main text-sm shrink-0">
                    {formatPrice(
                      (item.product.price +
                        (item.variant?.price_adjustment ?? 0)) *
                        item.quantity,
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-extrabold text-text-main text-xl mb-4">
              💳 Ringkasan Pembayaran
            </h2>
            <div className="bg-white rounded-2xl border border-border-soft p-6 sticky top-24">
              {/* Voucher promo input */}
              <div className="border-b border-border-soft pb-4 mb-4">
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2">
                  Voucher Promo
                </p>
                {appliedVoucher ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-green-700">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold tracking-wider uppercase">
                        🎫 {appliedVoucher.code}
                      </span>
                      <span className="text-xs">
                        (
                        {appliedVoucher.discount_type === "percentage"
                          ? `${appliedVoucher.discount_value}%`
                          : formatPrice(appliedVoucher.discount_value)}
                        )
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveVoucher}
                      className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Masukkan kode voucher"
                      value={voucherCodeInput}
                      onChange={(e) => setVoucherCodeInput(e.target.value)}
                      className="flex-1 border border-border-soft rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary uppercase"
                    />
                    <button
                      onClick={handleApplyVoucher}
                      disabled={checkingVoucher || !voucherCodeInput.trim()}
                      className="bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
                    >
                      {checkingVoucher ? "..." : "Gunakan"}
                    </button>
                  </div>
                )}
                {voucherError && (
                  <p className="text-red-500 text-[10px] font-semibold mt-1">
                    {voucherError}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between text-text-muted">
                  <span>Subtotal ({items.length} item)</span>
                  <span className="font-semibold text-text-main">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Potongan Voucher</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-text-muted">
                  <span>Ongkos Kirim ({distance} km)</span>
                  <span className="font-semibold text-text-main">
                    {formatPrice(shipping)}
                  </span>
                </div>
                <div className="border-t border-dashed border-border-soft my-1" />
                <div className="flex justify-between text-text-main font-extrabold text-lg">
                  <span>Total Bayar</span>
                  <span className="text-accent">{formatPrice(total)}</span>
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl mt-4">
                  {error}
                </div>
              )}
              <button
                onClick={handlePlaceOrder}
                disabled={processing || !addressForm.address}
                className="w-full mt-6 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                {processing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Bayar Sekarang
                  </>
                )}
              </button>
              {!addressForm.address && (
                <p className="text-center text-xs text-red-500 mt-2">
                  Isi alamat pengiriman terlebih dahulu
                </p>
              )}
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-primary" />
                  SSL Aman
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-primary" />
                  Via Midtrans
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-primary" />
                  Terenkripsi
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
