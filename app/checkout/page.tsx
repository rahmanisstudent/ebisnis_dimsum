/* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability */
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
  Navigation,
  Ticket,
  ChevronDown,
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
  variant: any;
}

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

function CheckoutContent() {
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Address and Contact forms
  const [editingAddress, setEditingAddress] = useState(true);
  const [addressForm, setAddressForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    district: "depok", // Default selection matching dictionary
    sub_district: "",  // Kelurahan text input
  });

  // Guest details form (only visible if guest)
  const [guestForm, setGuestForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Coordinates
  const [coordinates, setCoordinates] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });

  // Geolocation state
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  // Voucher state
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [showVoucherList, setShowVoucherList] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const itemsParam = searchParams.get("items") ?? "";

  const fetchData = useCallback(async () => {
    // 1. Authenticate user
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    setUser(currentUser);

    // 2. Fetch active vouchers for reference list
    const { data: vouchersData } = await supabase
      .from("vouchers")
      .select("*")
      .eq("is_active", true)
      .gte("valid_until", new Date().toISOString());
    setAvailableVouchers(vouchersData ?? []);

    // 3. Load checkout items
    if (itemsParam === "guest") {
      // ── Guest Checkout Mode ──
      try {
        const checkoutGuestItems = JSON.parse(localStorage.getItem("checkout_guest_items") ?? "[]");
        if (checkoutGuestItems.length === 0) {
          setItems([]);
          setLoading(false);
          return;
        }

        const productIds = checkoutGuestItems.map((i: any) => i.product_id);
        const { data: dbProducts } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds);

        const variantIds = checkoutGuestItems.filter((i: any) => i.variant_id).map((i: any) => i.variant_id);
        const variantsMap: Record<string, any> = {};
        if (variantIds.length > 0) {
          const { data: variantsData } = await supabase
            .from("product_variants")
            .select("*")
            .in("id", variantIds);
          (variantsData ?? []).forEach((v: any) => {
            variantsMap[v.id] = v;
          });
        }

        const fetched = checkoutGuestItems.map((item: any, idx: number) => {
          const product = dbProducts?.find((p: any) => p.id === item.product_id);
          return {
            id: `guest-checkout-${idx}`,
            cart_id: "guest",
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            quantity: item.quantity,
            created_at: new Date().toISOString(),
            product: product || null,
            variant: item.variant_id ? (variantsMap[item.variant_id] ?? null) : null,
          };
        }).filter((item: any) => item.product !== null) as CartItemWithProduct[];

        setItems(fetched);
      } catch (e) {
        console.error("Failed to parse guest checkout items", e);
      }
      setLoading(false);
      return;
    }

    // ── Authenticated User Checkout Mode ──
    if (!currentUser) {
      router.push("/login");
      return;
    }

    // Fetch user profile
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (profileData) {
      const p = profileData as UserProfile;
      setProfile(p);
      setAddressForm({
        full_name: p.full_name ?? "",
        phone: p.phone ?? "",
        address: p.address ?? "",
        district: p.district || "depok",
        sub_district: p.sub_district ?? "",
      });
      if (p.latitude && p.longitude) {
        setCoordinates({ latitude: p.latitude, longitude: p.longitude });
      }
      setEditingAddress(false);
    }

    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", currentUser.id)
      .single();

    if (!cart) {
      setLoading(false);
      return;
    }

    const selectedItemIds = itemsParam.split(",").filter(Boolean);
    let query = supabase
      .from("cart_items")
      .select("*, product:products(*)")
      .eq("cart_id", cart.id);

    if (selectedItemIds.length > 0) {
      query = query.in("id", selectedItemIds);
    }

    const { data: rawItems, error: fetchErr } = await query;
    if (fetchErr) {
      console.error("[Checkout] Fetch error:", fetchErr.message);
      setLoading(false);
      return;
    }

    const cartItems = rawItems ?? [];

    const variantIds = [
      ...new Set(
        cartItems
          .filter((i: any) => i.variant_id)
          .map((i: any) => i.variant_id as string)
      ),
    ];

    const variantsMap: Record<string, any> = {};
    if (variantIds.length > 0) {
      const { data: variantsData } = await supabase
        .from("product_variants")
        .select("*")
        .in("id", variantIds);
      (variantsData ?? []).forEach((v: any) => {
        variantsMap[v.id] = v;
      });
    }

    const fetched = cartItems.map((item: any) => ({
      ...item,
      variant: item.variant_id ? (variantsMap[item.variant_id] ?? null) : null,
    }));

    setItems(fetched as CartItemWithProduct[]);
    setLoading(false);
  }, [supabase, router, itemsParam]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set Profile Helper for RLS
  const setProfile = (p: UserProfile) => {
    // Local variable profile holds it
  };

  const subtotal = items.reduce((sum, item) => {
    const itemPrice = item.product.price + (item.variant?.price_adjustment ?? 0);
    return sum + itemPrice * item.quantity;
  }, 0);

  // Voucher discount calculation
  let discountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discount_type === "percentage") {
      discountAmount = Math.round(subtotal * (appliedVoucher.discount_value / 100));
    } else {
      discountAmount = Math.min(appliedVoucher.discount_value, subtotal);
    }
  }

  // Get shipping cost
  const { cost: shipping, distance } = calculateShippingCost(
    addressForm.sub_district,
    addressForm.district,
    coordinates.latitude,
    coordinates.longitude
  );

  const total = Math.max(0, subtotal - discountAmount + shipping);

  // HTML5 Geolocation API Handler
  function handleGetLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("Browser Anda tidak mendukung GPS.");
      return;
    }
    setGeoLoading(true);
    setGeoStatus("Mendeteksi koordinat GPS...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGeoStatus(`GPS Terdeteksi: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        setGeoLoading(false);
      },
      (err) => {
        console.error("GPS error:", err);
        setGeoStatus("Gagal mengakses GPS. Pastikan izin lokasi aktif.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleApplyVoucher(code: string) {
    const codeToApply = code.trim().toUpperCase();
    if (!codeToApply) return;

    setCheckingVoucher(true);
    setVoucherError(null);
    try {
      const { data: voucher, error: vError } = await supabase
        .from("vouchers")
        .select("*")
        .eq("code", codeToApply)
        .single();

      if (vError || !voucher) {
        throw new Error("Voucher tidak ditemukan.");
      }

      const v = voucher as Voucher;

      if (!v.is_active) {
        throw new Error("Voucher tidak aktif.");
      }

      const now = new Date();
      if (new Date(v.valid_from) > now) {
        throw new Error("Voucher belum berlaku.");
      }

      if (new Date(v.valid_until) < now) {
        throw new Error("Voucher telah kedaluwarsa.");
      }

      if (v.max_uses !== null && v.used_count >= v.max_uses) {
        throw new Error("Voucher ini telah melebihi batas kuota penggunaan.");
      }

      if (subtotal < v.min_purchase) {
        throw new Error(
          `Minimal pembelian untuk voucher ini adalah ${formatPrice(v.min_purchase)}.`
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
    YOGYA_DISTRICTS.find(d => d.value === addressForm.district)?.label || addressForm.district,
    "Yogyakarta",
  ]
    .filter(Boolean)
    .join(", ");

  async function handlePlaceOrder() {
    setProcessing(true);
    setError(null);
    try {
      if (items.length === 0) throw new Error("Keranjang belanja kosong.");

      // Form validation
      if (!addressForm.full_name || !addressForm.phone || !addressForm.address || !addressForm.district) {
        throw new Error("Mohon lengkapi formulir alamat pengiriman.");
      }

      if (!user) {
        // Validate guest contact
        if (!guestForm.name || !guestForm.email || !guestForm.phone) {
          throw new Error("Mohon lengkapi formulir informasi kontak Tamu (Guest).");
        }
      }

      // ── Make secure request to server checkout endpoint ──
      const payload = {
        items: items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        shipping_address: shippingAddressText,
        sub_district: addressForm.sub_district,
        district: addressForm.district,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        voucher_code: appliedVoucher?.code || null,
        // Guest contact fields
        guest_name: user ? undefined : guestForm.name,
        guest_email: user ? undefined : guestForm.email,
        guest_phone: user ? undefined : guestForm.phone,
      };

      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Gagal memproses pesanan.");
      }

      // Order created successfully. Clear cart
      if (user) {
        // Logged in: delete items from DB cart
        const itemIds = items.map((i) => i.id);
        await supabase.from("cart_items").delete().in("id", itemIds);
      } else {
        // Guest: clear localstorage cart
        localStorage.removeItem("guest_cart");
        localStorage.removeItem("checkout_guest_items");
        // Notify NavbarCart
        window.dispatchEvent(new Event("cartUpdated"));
      }

      // Redirect to payment gateway Snap URL
      window.location.assign(body.payment_url);
    } catch (err) {
      setError((err as Error).message);
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 text-center p-4">
        <div className="text-5xl">🛒</div>
        <h2 className="font-bold text-text-main">
          Tidak ada item untuk di-checkout
        </h2>
        <Link href="/cart" className="text-primary font-semibold hover:underline">
          Kembali ke Keranjang
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Address & Order Details */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Contact details for Guest checkout */}
            {!user && (
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-extrabold text-text-main text-base mb-4 flex items-center gap-2">
                  <span className="inline-flex w-6 h-6 rounded-lg bg-primary/10 text-primary items-center justify-center text-xs font-black">1</span>
                  Informasi Kontak Tamu
                </h2>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-text-muted uppercase">Nama Lengkap</label>
                      <input
                        type="text"
                        placeholder="Nama Tamu"
                        value={guestForm.name}
                        onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                        className="w-full text-xs border border-border-soft rounded-xl px-4 py-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-muted uppercase">Nomor WhatsApp</label>
                      <input
                        type="tel"
                        placeholder="08xxxxxxxxxx"
                        value={guestForm.phone}
                        onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                        className="w-full text-xs border border-border-soft rounded-xl px-4 py-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase">Alamat Email</label>
                    <input
                      type="email"
                      placeholder="nama@email.com"
                      value={guestForm.email}
                      onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                      className="w-full text-xs border border-border-soft rounded-xl px-4 py-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <p className="text-[10px] text-text-muted mt-1 italic">Email digunakan untuk melacak status pesanan Anda.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Address Section */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-extrabold text-text-main text-base mb-4 flex items-center gap-2">
                <span className="inline-flex w-6 h-6 rounded-lg bg-primary/10 text-primary items-center justify-center text-xs font-black">
                  {user ? "1" : "2"}
                </span>
                📍 Alamat Pengiriman
              </h2>

              {editingAddress ? (
                <div className="flex flex-col gap-4">
                  {/* GPS Pinpoint Button */}
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-text-main flex items-center gap-1.5">
                        <Navigation size={14} className="text-primary animate-pulse" />
                        Gunakan GPS Lokasi Presisi
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        Dapatkan tarif ongkos kirim paling akurat berdasarkan koordinat Anda.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={geoLoading}
                      className="bg-white hover:bg-gray-50 border border-gray-200 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shrink-0 shadow-sm"
                    >
                      {geoLoading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} className="text-primary" />}
                      {coordinates.latitude ? "GPS Aktif" : "Ambil GPS"}
                    </button>
                  </div>

                  {geoStatus && (
                    <p className={`text-[10px] font-bold ${coordinates.latitude ? "text-emerald-600" : "text-amber-600"}`}>
                      {geoStatus}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nama penerima di alamat"
                      value={addressForm.full_name}
                      onChange={(e) =>
                        setAddressForm((f) => ({
                          ...f,
                          full_name: e.target.value,
                        }))
                      }
                      className="w-full text-xs border border-border-soft rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <input
                      type="tel"
                      placeholder="Nomor telepon penerima"
                      value={addressForm.phone}
                      onChange={(e) =>
                        setAddressForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      className="w-full text-xs border border-border-soft rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <textarea
                    placeholder="Nama jalan, nomor rumah, RT/RW, dan patokan..."
                    value={addressForm.address}
                    onChange={(e) =>
                      setAddressForm((f) => ({ ...f, address: e.target.value }))
                    }
                    rows={2}
                    className="w-full text-xs border border-border-soft rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-text-muted uppercase">Kecamatan (Wilayah Jogja)</label>
                      <select
                        value={addressForm.district}
                        onChange={(e) =>
                          setAddressForm((f) => ({
                            ...f,
                            district: e.target.value,
                          }))
                        }
                        className="w-full text-xs border border-border-soft rounded-xl px-4 py-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                      >
                        {YOGYA_DISTRICTS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-text-muted uppercase">Kelurahan / Desa</label>
                      <input
                        type="text"
                        placeholder="Tulis kelurahan/desa"
                        value={addressForm.sub_district}
                        onChange={(e) =>
                          setAddressForm((f) => ({
                            ...f,
                            sub_district: e.target.value,
                          }))
                        }
                        className="w-full text-xs border border-border-soft rounded-xl px-4 py-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (addressForm.full_name && addressForm.phone && addressForm.address) {
                        setEditingAddress(false);
                      }
                    }}
                    className="bg-primary hover:bg-primary-dark text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow"
                  >
                    Simpan Alamat
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-primary shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-semibold text-text-main">
                        {addressForm.full_name || "Nama belum diisi"}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{addressForm.phone}</p>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">
                        {addressForm.address}, Kel. {addressForm.sub_district || "-"},{" "}
                        Kec. {YOGYA_DISTRICTS.find((d) => d.value === addressForm.district)?.label || addressForm.district}, Yogyakarta
                      </p>
                      {coordinates.latitude && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md mt-2 border border-emerald-100">
                          <Navigation size={8} /> GPS Pinpoint Aktif
                        </span>
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
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-extrabold text-text-main text-base mb-4 flex items-center gap-2">
                <span className="inline-flex w-6 h-6 rounded-lg bg-primary/10 text-primary items-center justify-center text-xs font-black">
                  {user ? "2" : "3"}
                </span>
                🧾 Rincian Menu Dimsum
              </h2>
              <div className="divide-y divide-gray-50 border border-gray-100 rounded-2xl overflow-hidden">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 items-center bg-white">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-cream shrink-0">
                      <Image
                        src={getProductImageUrl(item.product.image_url)}
                        alt={item.product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-main text-xs truncate">
                        {item.product.name}
                      </p>
                      {item.variant && (
                        <p className="text-[10px] text-primary-dark font-extrabold mt-0.5">
                          Varian: {item.variant.name}
                        </p>
                      )}
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {item.quantity} x{" "}
                        {formatPrice(
                          item.product.price + (item.variant?.price_adjustment ?? 0)
                        )}
                      </p>
                    </div>
                    <span className="font-extrabold text-text-main text-xs shrink-0">
                      {formatPrice(
                        (item.product.price + (item.variant?.price_adjustment ?? 0)) *
                          item.quantity
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Payment Summary & Checkout Action */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm sticky top-24">
              <h2 className="font-extrabold text-text-main text-base mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-primary" />
                Ringkasan Pembayaran
              </h2>

              {/* Voucher promo input & accordion list */}
              <div className="border-b border-gray-100 pb-4 mb-4">
                <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
                  <Ticket size={12} /> Voucher Promo
                </p>

                {appliedVoucher ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-green-700">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-wider uppercase">
                        🎫 {appliedVoucher.code}
                      </span>
                      <span className="text-[10px] font-bold">
                        (
                        {appliedVoucher.discount_type === "percentage"
                          ? `${appliedVoucher.discount_value}%`
                          : formatPrice(appliedVoucher.discount_value)}
                        )
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveVoucher}
                      className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ketik kode promo"
                        value={voucherCodeInput}
                        onChange={(e) => setVoucherCodeInput(e.target.value)}
                        className="flex-1 border border-border-soft rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary uppercase"
                      />
                      <button
                        onClick={() => handleApplyVoucher(voucherCodeInput)}
                        disabled={checkingVoucher || !voucherCodeInput.trim()}
                        className="bg-primary hover:bg-primary-dark disabled:bg-gray-200 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
                      >
                        {checkingVoucher ? "..." : "Pakai"}
                      </button>
                    </div>

                    {/* Active vouchers list toggle */}
                    {availableVouchers.length > 0 && (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={() => setShowVoucherList(!showVoucherList)}
                          className="flex items-center justify-between w-full text-[10px] font-bold text-primary hover:text-primary-dark"
                        >
                          <span>Lihat Promo Yang Tersedia ({availableVouchers.length})</span>
                          <ChevronDown size={12} className={showVoucherList ? "rotate-180" : ""} />
                        </button>

                        {showVoucherList && (
                          <div className="mt-2 flex flex-col gap-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-100 max-h-36 overflow-y-auto">
                            {availableVouchers.map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => {
                                  setVoucherCodeInput(v.code);
                                  handleApplyVoucher(v.code);
                                  setShowVoucherList(false);
                                }}
                                className="flex items-center justify-between text-[10px] text-left p-1.5 bg-white border border-gray-100 rounded-lg hover:border-primary/50 transition"
                              >
                                <div>
                                  <span className="font-extrabold text-primary-dark border border-primary/20 bg-primary-light/35 px-1 py-0.5 rounded mr-1">
                                    {v.code}
                                  </span>
                                  <span className="font-medium text-text-muted">
                                    (Min. {formatPrice(v.min_purchase)})
                                  </span>
                                </div>
                                <span className="font-black text-accent">
                                  {v.discount_type === "percentage" ? `${v.discount_value}%` : formatPrice(v.discount_value)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {voucherError && (
                  <p className="text-red-500 text-[10px] font-bold mt-1.5">
                    {voucherError}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 text-xs">
                <div className="flex justify-between text-text-muted">
                  <span>Subtotal ({items.length} item)</span>
                  <span className="font-bold text-text-main">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Diskon Voucher</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-text-muted">
                  <span>Ongkos Kirim ({distance} km)</span>
                  <span className="font-bold text-text-main">
                    {formatPrice(shipping)}
                  </span>
                </div>
                <div className="border-t border-dashed border-border-soft my-1" />
                <div className="flex justify-between text-text-main font-extrabold text-base pt-1">
                  <span>Total Tagihan</span>
                  <span className="text-accent text-lg">{formatPrice(total)}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-4 py-3 rounded-2xl mt-4">
                  {error}
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={processing || editingAddress || (!user && (!guestForm.name || !guestForm.email || !guestForm.phone))}
                className="w-full mt-6 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 text-sm"
              >
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Memproses Pembayaran...
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    Bayar Sekarang
                  </>
                )}
              </button>

              {editingAddress && (
                <p className="text-center text-[10px] text-red-500 font-bold mt-2">
                  Simpan alamat Anda terlebih dahulu
                </p>
              )}

              <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-text-muted">
                <span className="flex items-center gap-1 font-medium">
                  <CheckCircle2 size={10} className="text-primary" />
                  Keamanan SSL
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <CheckCircle2 size={10} className="text-primary" />
                  Midtrans Sandbox
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <CheckCircle2 size={10} className="text-primary" />
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
      fallback = {
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={24} className="text-primary animate-spin" />
            <span className="text-sm text-text-muted font-medium">Memuat Checkout...</span>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
