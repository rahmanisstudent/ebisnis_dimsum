"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, MapPin, Save, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types";
import NavbarCart from "@/components/navbar-cart";

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
    district: "",
    sub_district: "",
    city: "Yogyakarta",
  });

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
          district: p.district ?? "",
          sub_district: p.sub_district ?? "",
          city: p.city ?? "Yogyakarta",
        });
      } else {
        // Profile doesn't exist yet — create it
        await supabase.from("user_profiles").insert({ id: user.id });
      }
      setLoading(false);
    }
    fetchProfile();
  }, [supabase, router]);

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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors duration-200 font-medium mb-6">
          <ArrowLeft size={16} />
          Kembali ke Menu
        </Link>

        <h1 className="text-2xl md:text-3xl font-extrabold text-text-main mb-8">
          👤 Profil Saya
        </h1>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* Email (read-only) */}
          <div className="surface-card p-6">
            <h2 className="font-bold text-text-main mb-4 flex items-center gap-2">
              <Mail size={16} className="text-primary" />
              Informasi Akun
            </h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-muted">Email</label>
              <input type="email" value={email} disabled className={`${inputClass} bg-cream text-text-muted cursor-not-allowed`} />
            </div>
          </div>

          {/* Personal Info */}
          <div className="surface-card p-6">
            <h2 className="font-bold text-text-main mb-4 flex items-center gap-2">
              <User size={16} className="text-primary" />
              Data Diri
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="full_name" className="text-sm font-semibold text-text-main">Nama Lengkap</label>
                <input
                  id="full_name" type="text" placeholder="Masukkan nama lengkap"
                  value={form.full_name} onChange={(e) => setForm(f => ({...f, full_name: e.target.value}))}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-sm font-semibold text-text-main">Nomor Telepon</label>
                <input
                  id="phone" type="tel" placeholder="08xxxxxxxxxx"
                  value={form.phone} onChange={(e) => setForm(f => ({...f, phone: e.target.value}))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="surface-card p-6">
            <h2 className="font-bold text-text-main mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              Alamat Pengiriman Default
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="address" className="text-sm font-semibold text-text-main">Alamat Lengkap</label>
                <textarea
                  id="address" placeholder="Jl. Contoh No. 123, RT 01/RW 02" rows={3}
                  value={form.address} onChange={(e) => setForm(f => ({...f, address: e.target.value}))}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="sub_district" className="text-sm font-semibold text-text-main">Kelurahan</label>
                  <input
                    id="sub_district" type="text" placeholder="Kelurahan"
                    value={form.sub_district} onChange={(e) => setForm(f => ({...f, sub_district: e.target.value}))}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="district" className="text-sm font-semibold text-text-main">Kecamatan</label>
                  <input
                    id="district" type="text" placeholder="Kecamatan"
                    value={form.district} onChange={(e) => setForm(f => ({...f, district: e.target.value}))}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="city" className="text-sm font-semibold text-text-main">Kota</label>
                <input id="city" type="text" value={form.city} disabled className={`${inputClass} bg-cream text-text-muted cursor-not-allowed`} />
                <p className="text-xs text-text-muted">Area pengiriman hanya untuk Yogyakarta</p>
              </div>
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            {saving ? (
              <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
            ) : saved ? (
              <><CheckCircle2 size={18} /> Tersimpan!</>
            ) : (
              <><Save size={18} /> Simpan Profil</>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
