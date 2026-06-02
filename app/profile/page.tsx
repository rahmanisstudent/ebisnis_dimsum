"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, MapPin, Save, Loader2, ArrowLeft, CheckCircle2, Navigation } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types";
import NavbarCart from "@/components/navbar-cart";

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    district: "depok",
    sub_district: "",
    city: "Yogyakarta",
  });

  const [coordinates, setCoordinates] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const p = data as UserProfile;
        setProfile(p);
        setForm({
          full_name: p.full_name ?? "",
          phone: p.phone ?? "",
          address: p.address ?? "",
          district: p.district || "depok",
          sub_district: p.sub_district ?? "",
          city: p.city ?? "Yogyakarta",
        });
        setCoordinates({
          latitude: p.latitude ?? null,
          longitude: p.longitude ?? null,
        });
      } else {
        // Profile doesn't exist yet — create it
        await supabase.from("user_profiles").insert({ id: user.id });
      }
      setLoading(false);
    }
    fetchProfile();
  }, [supabase, router]);

  // GPS Pinpoint Handler
  function handleGetLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("Geolocation tidak didukung browser ini");
      return;
    }
    setGeoLoading(true);
    setGeoStatus("Mencari GPS...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGeoStatus(`GPS Siap: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        setGeoLoading(false);
      },
      (err) => {
        console.error(err);
        setGeoStatus("Gagal mencari lokasi GPS. Periksa izin lokasi.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        full_name: form.full_name || null,
        phone: form.phone || null,
        address: form.address || null,
        district: form.district || null,
        sub_district: form.sub_district || null,
        city: form.city,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      setError("Gagal menyimpan profil: " + updateError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  const inputClass = "w-full border border-border-soft rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors duration-200 font-medium mb-6">
          <ArrowLeft size={16} />
          Kembali ke Menu
        </Link>

        <h1 className="text-2xl md:text-3xl font-extrabold text-text-main mb-8">
          👤 Profil Saya
        </h1>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* Email */}
          <div className="surface-card p-6 shadow-sm border border-gray-100/70">
            <h2 className="font-bold text-text-main mb-4 flex items-center gap-2 text-sm">
              <Mail size={16} className="text-primary" />
              Informasi Akun
            </h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase">Email</label>
              <input type="email" value={email} disabled className={`${inputClass} bg-cream text-text-muted cursor-not-allowed`} />
            </div>
          </div>

          {/* Personal Info */}
          <div className="surface-card p-6 shadow-sm border border-gray-100/70">
            <h2 className="font-bold text-text-main mb-4 flex items-center gap-2 text-sm">
              <User size={16} className="text-primary" />
              Data Diri
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="full_name" className="text-xs font-semibold text-text-main uppercase">Nama Lengkap</label>
                <input
                  id="full_name" type="text" placeholder="Masukkan nama lengkap"
                  value={form.full_name} onChange={(e) => setForm(f => ({...f, full_name: e.target.value}))}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-xs font-semibold text-text-main uppercase">Nomor Telepon (WhatsApp)</label>
                <input
                  id="phone" type="tel" placeholder="08xxxxxxxxxx"
                  value={form.phone} onChange={(e) => setForm(f => ({...f, phone: e.target.value}))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Address & GPS */}
          <div className="surface-card p-6 shadow-sm border border-gray-100/70">
            <h2 className="font-bold text-text-main mb-4 flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-primary" />
              Alamat Pengiriman Default
            </h2>
            <div className="flex flex-col gap-4">
              {/* Geolocation Input Button */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div>
                  <p className="text-xs font-bold text-text-main flex items-center gap-1.5">
                    <Navigation size={14} className="text-primary animate-pulse" />
                    Koordinat GPS (Opsional)
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    Membantu kurir melacak titik tujuan dengan presisi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={geoLoading}
                  className="bg-white hover:bg-gray-50 border border-gray-200 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shrink-0 shadow-sm"
                >
                  {geoLoading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} className="text-primary" />}
                  {coordinates.latitude ? "GPS Terpasang" : "Pinpoint GPS"}
                </button>
              </div>

              {geoStatus && (
                <p className={`text-[10px] font-bold ${coordinates.latitude ? "text-emerald-600" : "text-amber-600"}`}>
                  {geoStatus}
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="address" className="text-xs font-semibold text-text-main uppercase">Alamat Lengkap</label>
                <textarea
                  id="address" placeholder="Jl. Contoh No. 123, RT 01/RW 02" rows={3}
                  value={form.address} onChange={(e) => setForm(f => ({...f, address: e.target.value}))}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="district" className="text-xs font-semibold text-text-main uppercase">Kecamatan (Wilayah Jogja)</label>
                  <select
                    id="district"
                    value={form.district}
                    onChange={(e) => setForm(f => ({...f, district: e.target.value}))}
                    className={inputClass}
                  >
                    {YOGYA_DISTRICTS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="sub_district" className="text-xs font-semibold text-text-main uppercase">Kelurahan</label>
                  <input
                    id="sub_district" type="text" placeholder="Tulis Kelurahan"
                    value={form.sub_district} onChange={(e) => setForm(f => ({...f, sub_district: e.target.value}))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="city" className="text-xs font-semibold text-text-main uppercase">Kota</label>
                <input id="city" type="text" value={form.city} disabled className={`${inputClass} bg-cream text-text-muted cursor-not-allowed`} />
                <p className="text-[10px] text-text-muted">Layanan pengantaran DimsumStore saat ini terbatas untuk area D.I. Yogyakarta.</p>
              </div>
            </div>
          </div>

          {/* Error / Success message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl font-semibold">
              {error}
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 text-sm"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
            ) : saved ? (
              <><CheckCircle2 size={16} /> Perubahan Tersimpan!</>
            ) : (
              <><Save size={16} /> Simpan Perubahan Profil</>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
