/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Zap, MapPin, Navigation, Loader2, CreditCard, ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, getProductImageUrl, calculateShippingCost } from "@/lib/utils";

const YOGYA_DISTRICTS = [
  { value: "danurejan", label: "Danurejan (Kota)" },
  { value: "gedongtengen", label: "Gedongtengen (Kota)" },
  { value: "gondokusuman", label: "Gondokusuman (Kota)" },
  { value: "gondomanan", label: "Gondomanan (Kota)" },
  { value: "jetis", label: "Jetis (Kota)" },
  { value: "kotagede", label: "Kotagede (Kota)" },
  { value: "kraton", label: "Kraton (Kota)" },
  { value: "mantrijeron", label: "Mantrijeron (Kota)" },
  { value: "mergangsan", label: "Mergangsan (Kota)" },
  { value: "ngampilan", label: "Ngampilan (Kota)" },
  { value: "pakualaman", label: "Pakualaman (Kota)" },
  { value: "tegalrejo", label: "Tegalrejo (Kota)" },
  { value: "umbulharjo", label: "Umbulharjo (Kota)" },
  { value: "wirobrajan", label: "Wirobrajan (Kota)" },
  { value: "depok", label: "Depok (Sleman)" },
  { value: "mlati", label: "Mlati (Sleman)" },
  { value: "gamping", label: "Gamping (Sleman)" },
  { value: "sleman", label: "Sleman (Sleman)" },
  { value: "ngaglik", label: "Ngaglik (Sleman)" },
  { value: "kalasan", label: "Kalasan (Sleman)" },
  { value: "berbah", label: "Berbah (Sleman)" },
  { value: "godean", label: "Godean (Sleman)" },
  { value: "kasihan", label: "Kasihan (Bantul)" },
  { value: "sewon", label: "Sewon (Bantul)" },
  { value: "banguntapan", label: "Banguntapan (Bantul)" },
  { value: "bantul", label: "Bantul (Bantul)" },
  { value: "piyungan", label: "Piyungan (Bantul)" },
  { value: "jetis bantul", label: "Jetis (Bantul)" },
  { value: "pundong", label: "Pundong (Bantul)" },
];

function GuestCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const productId = searchParams.get("product_id") ?? "";
  const variantId = searchParams.get("variant_id") ?? null;
  const quantity = Math.max(1, parseInt(searchParams.get("quantity") ?? "1"));

  const [product, setProduct] = useState<any>(null);
  const [variant, setVariant] = useState<any>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [guest, setGuest] = useState({ name: "", email: "", phone: "" });
  const [addr, setAddr] = useState({
    address: "", district: "depok", sub_district: "",
  });
  const [coords, setCoords] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null, longitude: null,
  });
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  // ── Load product & variant ────────────────────────────────────────────────
  useEffect(() => {
    if (!productId) { setLoadingProduct(false); return; }
    (async () => {
      const { data: prod } = await supabase.from("products").select("*").eq("id", productId).single();
      setProduct(prod ?? null);
      if (variantId) {
        const { data: v } = await supabase.from("product_variants").select("*").eq("id", variantId).single();
        setVariant(v ?? null);
      }
      setLoadingProduct(false);
    })();
  }, [productId, variantId]);

  const itemPrice = product ? product.price + (variant?.price_adjustment ?? 0) : 0;
  const subtotal = itemPrice * quantity;
  const { cost: shipping } = calculateShippingCost(addr.sub_district, addr.district, coords.latitude, coords.longitude);
  const total = subtotal + shipping;

  function handleGetLocation() {
    if (!navigator.geolocation) { setGeoStatus("Browser tidak mendukung GPS."); return; }
    setGeoLoading(true);
    setGeoStatus("Mendeteksi koordinat...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setGeoStatus(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setGeoLoading(false);
      },
      () => { setGeoStatus("Gagal akses GPS."); setGeoLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!guest.name.trim() || !guest.email.trim() || !guest.phone.trim()) {
      setError("Lengkapi informasi kontak (nama, email, nomor telepon)."); return;
    }
    if (!addr.address.trim() || !addr.district) {
      setError("Lengkapi alamat pengiriman."); return;
    }

    setProcessing(true);

    const shippingAddressText = [
      guest.name, guest.phone, addr.address, addr.sub_district,
      YOGYA_DISTRICTS.find((d) => d.value === addr.district)?.label ?? addr.district,
      "Yogyakarta",
    ].filter(Boolean).join(", ");

    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ product_id: productId, variant_id: variantId, quantity }],
          shipping_address: shippingAddressText,
          sub_district: addr.sub_district,
          district: addr.district,
          latitude: coords.latitude,
          longitude: coords.longitude,
          guest_name: guest.name,
          guest_email: guest.email,
          guest_phone: guest.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pesanan.");
      window.location.assign(data.payment_url);
    } catch (err) {
      setError((err as Error).message);
      setProcessing(false);
    }
  }

  if (loadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-4">
        <p className="font-bold text-text-main">Produk tidak ditemukan.</p>
        <Link href="/" className="text-primary font-semibold hover:underline">Kembali ke Menu</Link>
      </div>
    );
  }

  const inputCls = "w-full text-sm border border-border-soft rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-colors";
  const labelCls = "text-[10px] font-bold text-text-muted uppercase tracking-wide block mb-1";

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link href={`/product/${productId}`}
            className="flex items-center gap-2 text-text-muted hover:text-primary text-sm font-medium transition-colors">
            <ArrowLeft size={16} /> Kembali
          </Link>
          <span className="font-extrabold text-text-main text-lg">Beli Sekarang</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ── Left column ── */}
            <div className="lg:col-span-7 flex flex-col gap-5">

              {/* 1. Product summary */}
              <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-extrabold text-text-main text-sm mb-4 flex items-center gap-2">
                  <span className="inline-flex w-6 h-6 rounded-lg bg-primary/10 text-primary items-center justify-center text-xs font-black">1</span>
                  Produk yang Dibeli
                </h2>
                <div className="flex gap-4 items-center">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-cream shrink-0">
                    <Image src={getProductImageUrl(product.image_url)} alt={product.name} fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text-main text-sm">{product.name}</p>
                    {variant && <p className="text-xs text-primary-dark font-semibold mt-0.5">Varian: {variant.name}</p>}
                    <p className="text-xs text-text-muted mt-0.5">{quantity} × {formatPrice(itemPrice)}</p>
                  </div>
                  <span className="font-extrabold text-accent text-sm shrink-0">{formatPrice(subtotal)}</span>
                </div>
              </div>

              {/* 2. Guest info */}
              <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-extrabold text-text-main text-sm mb-4 flex items-center gap-2">
                  <span className="inline-flex w-6 h-6 rounded-lg bg-primary/10 text-primary items-center justify-center text-xs font-black">2</span>
                  Informasi Kontak
                </h2>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Nama Lengkap *</label>
                      <input type="text" required placeholder="Nama pemesan"
                        value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Nomor WhatsApp *</label>
                      <input type="tel" required placeholder="08xxxxxxxxxx"
                        value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                        className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Alamat Email *</label>
                    <input type="email" required placeholder="nama@email.com"
                      value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                      className={inputCls} />
                    <p className="text-[10px] text-text-muted mt-1">Konfirmasi pesanan akan dikirim ke email ini.</p>
                  </div>
                </div>
              </div>

              {/* 3. Shipping address */}
              <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-extrabold text-text-main text-sm mb-4 flex items-center gap-2">
                  <span className="inline-flex w-6 h-6 rounded-lg bg-primary/10 text-primary items-center justify-center text-xs font-black">3</span>
                  Alamat Pengiriman
                </h2>

                {/* GPS */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs font-bold text-text-main flex items-center gap-1.5">
                      <Navigation size={13} className="text-primary animate-pulse" />
                      Gunakan GPS untuk ongkir akurat
                    </p>
                    {geoStatus && (
                      <p className={`text-[10px] font-semibold mt-0.5 ${coords.latitude ? "text-emerald-600" : "text-amber-600"}`}>
                        {geoStatus}
                      </p>
                    )}
                  </div>
                  <button type="button" onClick={handleGetLocation} disabled={geoLoading}
                    className="bg-white hover:bg-gray-50 border border-gray-200 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shrink-0 shadow-sm">
                    {geoLoading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} className="text-primary" />}
                    {coords.latitude ? "GPS Aktif ✓" : "Ambil GPS"}
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className={labelCls}>Detail Alamat *</label>
                    <textarea required placeholder="Nama jalan, nomor rumah, RT/RW, patokan..."
                      value={addr.address} onChange={(e) => setAddr({ ...addr, address: e.target.value })}
                      rows={2}
                      className="w-full text-sm border border-border-soft rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-colors resize-none" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Kecamatan *</label>
                      <select required value={addr.district} onChange={(e) => setAddr({ ...addr, district: e.target.value })} className={inputCls}>
                        {YOGYA_DISTRICTS.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Kelurahan / Desa</label>
                      <input type="text" placeholder="Nama kelurahan/desa"
                        value={addr.sub_district} onChange={(e) => setAddr({ ...addr, sub_district: e.target.value })}
                        className={inputCls} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right column: order summary ── */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm sticky top-24">
                <h2 className="font-extrabold text-text-main text-base mb-5 flex items-center gap-2">
                  <CreditCard size={18} className="text-primary" />
                  Ringkasan Pembayaran
                </h2>

                <div className="flex flex-col gap-3 text-sm border-b border-gray-100 pb-4 mb-4">
                  <div className="flex justify-between text-text-muted">
                    <span>Subtotal ({quantity} item)</span>
                    <span className="font-semibold text-text-main">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Ongkos Kirim</span>
                    <span className="font-semibold text-text-main">
                      {shipping > 0 ? formatPrice(shipping) : <span className="italic text-xs">Dihitung otomatis</span>}
                    </span>
                  </div>
                  <div className="flex justify-between text-text-main font-extrabold text-base pt-2 border-t border-dashed border-gray-100">
                    <span>Total</span>
                    <span className="text-accent">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Login suggestion */}
                <div className="bg-primary-light/40 border border-primary/10 rounded-2xl px-4 py-3 mb-4">
                  <p className="text-xs text-primary-dark font-medium leading-relaxed">
                    💡 <span className="font-bold">Punya akun?</span>{" "}
                    <Link href="/login" className="underline font-bold">Masuk</Link> untuk simpan riwayat pesanan & dapatkan akses review produk.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-4">
                    <p className="text-xs text-red-600 font-medium">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={processing}
                  className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-accent/20">
                  {processing ? (
                    <><Loader2 size={18} className="animate-spin" />Memproses...</>
                  ) : (
                    <><Zap size={18} />Bayar Sekarang • {formatPrice(total)}</>
                  )}
                </button>

                <p className="text-center text-xs text-text-muted mt-3">Pembayaran aman via Midtrans 🔒</p>
              </div>
            </div>

          </div>
        </form>
      </main>
    </div>
  );
}

export default function GuestCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    }>
      <GuestCheckoutContent />
    </Suspense>
  );
}
