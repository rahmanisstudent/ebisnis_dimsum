/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Zap, MapPin, Navigation, Loader2, CreditCard,
  CheckCircle2, Truck, Clock, Edit3,
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

/** Estimate delivery time based on distance in km */
function estimateDelivery(distanceKm: number): string {
  if (distanceKm <= 3)  return "30–60 menit";
  if (distanceKm <= 7)  return "1–2 jam";
  if (distanceKm <= 12) return "2–3 jam";
  if (distanceKm <= 18) return "3–4 jam";
  return "4–6 jam";
}

interface ShippingResult {
  cost: number;
  distance: number;
  estimatedTime: string;
  addressSummary: string;
}

function GuestCheckoutContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const productId  = searchParams.get("product_id") ?? "";
  const variantId  = searchParams.get("variant_id") ?? null;
  const quantity   = Math.max(1, parseInt(searchParams.get("quantity") ?? "1"));

  const [product, setProduct]           = useState<any>(null);
  const [variant, setVariant]           = useState<any>(null);
  const [loadingProduct, setLoading]    = useState(true);
  const [processing, setProcessing]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // Guest contact
  const [guest, setGuest] = useState({ name: "", email: "", phone: "" });

  // Shipping address (temp — only stored in orders.shipping_address on submit)
  const [addr, setAddr] = useState({ address: "", district: "depok", sub_district: "" });

  // GPS
  const [coords, setCoords]     = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });
  const [geoLoading, setGeoL]   = useState(false);
  const [geoStatus, setGeoS]    = useState<string | null>(null);

  // Address confirmation state
  const [shipping, setShipping]           = useState<ShippingResult | null>(null);
  const [addressConfirmed, setConfirmed]  = useState(false);

  // ── Load product & variant ────────────────────────────────────────────────
  useEffect(() => {
    if (!productId) { setLoading(false); return; }
    (async () => {
      const { data: prod } = await supabase.from("products").select("*").eq("id", productId).single();
      setProduct(prod ?? null);
      if (variantId) {
        const { data: v } = await supabase.from("product_variants").select("*").eq("id", variantId).single();
        setVariant(v ?? null);
      }
      setLoading(false);
    })();
  }, [productId, variantId]);

  // Reset confirmation when address fields change
  useEffect(() => {
    setConfirmed(false);
    setShipping(null);
  }, [addr.address, addr.district, addr.sub_district, coords.latitude, coords.longitude]);

  const itemPrice = product ? product.price + (variant?.price_adjustment ?? 0) : 0;
  const subtotal  = itemPrice * quantity;
  const total     = subtotal + (shipping?.cost ?? 0);

  // ── GPS ──────────────────────────────────────────────────────────────────
  function handleGetLocation() {
    if (!navigator.geolocation) { setGeoS("Browser tidak mendukung GPS."); return; }
    setGeoL(true);
    setGeoS("Mendeteksi koordinat...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setGeoS(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setGeoL(false);
      },
      () => { setGeoS("Gagal akses GPS. Pastikan izin lokasi aktif."); setGeoL(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ── Confirm address & calculate shipping ──────────────────────────────────
  function handleConfirmAddress() {
    if (!addr.address.trim()) {
      setError("Isi detail alamat terlebih dahulu."); return;
    }
    setError(null);

    const { cost, distance } = calculateShippingCost(
      addr.sub_district, addr.district, coords.latitude, coords.longitude
    );

    const districtLabel = YOGYA_DISTRICTS.find((d) => d.value === addr.district)?.label ?? addr.district;
    const addressSummary = [
      addr.address,
      addr.sub_district ? `Kel. ${addr.sub_district}` : null,
      `Kec. ${districtLabel}`,
      "Yogyakarta",
    ].filter(Boolean).join(", ");

    setShipping({
      cost,
      distance,
      estimatedTime: estimateDelivery(distance),
      addressSummary,
    });
    setConfirmed(true);
  }

  // ── Submit order ──────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!guest.name.trim() || !guest.email.trim() || !guest.phone.trim()) {
      setError("Lengkapi informasi kontak (nama, email, nomor telepon)."); return;
    }
    if (!addressConfirmed || !shipping) {
      setError("Konfirmasi alamat pengiriman terlebih dahulu."); return;
    }

    setProcessing(true);

    // Build full shipping address string — stored in orders.shipping_address only
    const shippingAddressText = [
      guest.name, guest.phone, addr.address,
      addr.sub_district,
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

  // ── Loading / not found ───────────────────────────────────────────────────
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

            {/* ══ LEFT COLUMN ══ */}
            <div className="lg:col-span-7 flex flex-col gap-5">

              {/* 1. Product */}
              <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-extrabold text-text-main text-sm mb-4 flex items-center gap-2">
                  <span className="step-badge">1</span>
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

              {/* 2. Guest contact */}
              <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-extrabold text-text-main text-sm mb-4 flex items-center gap-2">
                  <span className="step-badge">2</span>
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
                    <p className="text-[10px] text-text-muted mt-1">Konfirmasi pesanan dikirim ke email ini.</p>
                  </div>
                </div>
              </div>

              {/* 3. Shipping address */}
              <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-extrabold text-text-main text-sm mb-4 flex items-center gap-2">
                  <span className="step-badge">3</span>
                  Alamat Pengiriman
                </h2>

                {/* GPS button */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs font-bold text-text-main flex items-center gap-1.5">
                      <Navigation size={13} className="text-primary animate-pulse" />
                      Gunakan GPS untuk ongkir lebih akurat
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
                      <select required value={addr.district}
                        onChange={(e) => setAddr({ ...addr, district: e.target.value })}
                        className={inputCls}>
                        {YOGYA_DISTRICTS.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Kelurahan / Desa</label>
                      <input type="text" placeholder="Nama kelurahan/desa"
                        value={addr.sub_district}
                        onChange={(e) => setAddr({ ...addr, sub_district: e.target.value })}
                        className={inputCls} />
                    </div>
                  </div>

                  {/* ── Confirm address button ── */}
                  {!addressConfirmed ? (
                    <button
                      type="button"
                      onClick={handleConfirmAddress}
                      disabled={!addr.address.trim()}
                      className="mt-1 flex items-center justify-center gap-2 bg-primary/90 hover:bg-primary disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold py-3 px-5 rounded-xl transition-all duration-200 shadow-sm"
                    >
                      <Truck size={16} />
                      Cek Ongkos Kirim
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setConfirmed(false); setShipping(null); }}
                      className="mt-1 flex items-center gap-2 text-xs text-text-muted hover:text-primary font-semibold transition-colors"
                    >
                      <Edit3 size={13} />
                      Ubah Alamat
                    </button>
                  )}
                </div>

                {/* ── Shipping confirmation card ── */}
                {addressConfirmed && shipping && (
                  <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                      <CheckCircle2 size={16} className="shrink-0" />
                      Alamat Dikonfirmasi
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed font-medium pl-6">
                      {shipping.addressSummary}
                    </p>
                    <div className="grid grid-cols-3 gap-3 pl-0 mt-1">
                      <div className="bg-white rounded-xl p-3 border border-emerald-100 text-center">
                        <MapPin size={14} className="text-emerald-500 mx-auto mb-1" />
                        <p className="text-[10px] text-text-muted font-semibold uppercase">Jarak</p>
                        <p className="text-sm font-extrabold text-text-main">{shipping.distance} km</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-emerald-100 text-center">
                        <Truck size={14} className="text-emerald-500 mx-auto mb-1" />
                        <p className="text-[10px] text-text-muted font-semibold uppercase">Ongkir</p>
                        <p className="text-sm font-extrabold text-text-main">{formatPrice(shipping.cost)}</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-emerald-100 text-center">
                        <Clock size={14} className="text-emerald-500 mx-auto mb-1" />
                        <p className="text-[10px] text-text-muted font-semibold uppercase">Estimasi</p>
                        <p className="text-[11px] font-extrabold text-text-main leading-tight">{shipping.estimatedTime}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ══ RIGHT COLUMN: summary ══ */}
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
                    {shipping ? (
                      <span className="font-semibold text-text-main">{formatPrice(shipping.cost)}</span>
                    ) : (
                      <span className="text-xs italic text-text-muted/60">Konfirmasi alamat dulu</span>
                    )}
                  </div>
                  {shipping && (
                    <div className="flex justify-between text-[10px] text-text-muted/70">
                      <span>Estimasi pengiriman</span>
                      <span className="font-semibold">{shipping.estimatedTime}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-text-main font-extrabold text-base pt-2 border-t border-dashed border-gray-100">
                    <span>Total</span>
                    <span className="text-accent">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Login suggestion */}
                <div className="bg-primary-light/40 border border-primary/10 rounded-2xl px-4 py-3 mb-4">
                  <p className="text-xs text-primary-dark font-medium leading-relaxed">
                    💡 <span className="font-bold">Punya akun?</span>{" "}
                    <Link href="/login" className="underline font-bold">Masuk</Link>
                    {" "}untuk riwayat pesanan & review produk.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-4">
                    <p className="text-xs text-red-600 font-medium">{error}</p>
                  </div>
                )}

                {/* Pay button — only active when address confirmed */}
                <button
                  type="submit"
                  disabled={processing || !addressConfirmed}
                  className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-accent/20"
                >
                  {processing ? (
                    <><Loader2 size={18} className="animate-spin" />Memproses...</>
                  ) : (
                    <><Zap size={18} />{addressConfirmed ? `Bayar Sekarang • ${formatPrice(total)}` : "Konfirmasi Alamat Dulu"}</>
                  )}
                </button>

                {!addressConfirmed && (
                  <p className="text-center text-[10px] text-text-muted mt-2">
                    Klik "Cek Ongkos Kirim" di form alamat untuk melanjutkan
                  </p>
                )}
                <p className="text-center text-xs text-text-muted mt-2">Pembayaran aman via Midtrans 🔒</p>
              </div>
            </div>

          </div>
        </form>
      </main>

      <style jsx global>{`
        .step-badge {
          display: inline-flex;
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 0.5rem;
          background: rgba(192,57,43,0.1);
          color: #c0392b;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 900;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.25s ease; }
      `}</style>
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
