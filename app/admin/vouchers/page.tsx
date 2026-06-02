"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Ticket, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { Voucher } from "@/types";

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [discountValue, setDiscountValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const supabase = createClient();

  async function fetchVouchers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setVouchers((data as Voucher[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchVouchers();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !discountValue) return;

    setSaving(true);
    setError(null);

    const val = parseInt(discountValue, 10);
    const minP = parseInt(minPurchase, 10) || 0;
    const maxU = maxUses ? parseInt(maxUses, 10) : null;
    const expiry = validUntil ? new Date(validUntil).toISOString() : null;

    const { error: insertError } = await supabase.from("vouchers").insert({
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: val,
      min_purchase: minP,
      max_uses: maxU,
      is_active: true,
      valid_until: expiry,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setCode("");
      setDiscountValue("");
      setMinPurchase("");
      setMaxUses("");
      setValidUntil("");
      fetchVouchers();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus voucher ini?")) return;

    setDeletingId(id);
    setError(null);

    const { error: deleteError } = await supabase
      .from("vouchers")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      fetchVouchers();
    }
    setDeletingId(null);
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    const { error: updateError } = await supabase
      .from("vouchers")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, is_active: !currentStatus } : v,
        ),
      );
    }
  }

  const inputClass =
    "w-full border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-gray-900 text-white";
  const labelClass = "text-xs font-semibold text-gray-400";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Ticket className="text-emerald-500" size={28} />
        <h1 className="text-2xl font-extrabold text-white">
          Kelola Voucher Promo
        </h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-2xl mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Add Form */}
        <div className="md:col-span-4 bg-gray-900 border border-gray-800 rounded-2xl p-5 h-fit">
          <h2 className="text-white font-bold mb-4">Buat Voucher Baru</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="voucher_code" className={labelClass}>
                Kode Voucher
              </label>
              <input
                id="voucher_code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CONTOH: DIMSUMMERDEKA"
                required
                className="w-full border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-gray-900 text-white placeholder:text-gray-600 uppercase"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="voucher_type" className={labelClass}>
                Tipe Diskon
              </label>
              <select
                id="voucher_type"
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as "percentage" | "fixed")
                }
                className={inputClass}
              >
                <option value="percentage" className="bg-gray-900">
                  Persentase (%)
                </option>
                <option value="fixed" className="bg-gray-900">
                  Nominal Tetap (Rp)
                </option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="discount_val" className={labelClass}>
                Nilai Diskon {discountType === "percentage" ? "(%)" : "(Rp)"}
              </label>
              <input
                id="discount_val"
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percentage" ? "10" : "15000"}
                required
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="min_purchase" className={labelClass}>
                Minimal Pembelian (Rp)
              </label>
              <input
                id="min_purchase"
                type="number"
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="max_uses" className={labelClass}>
                Maks. Penggunaan (Opsional)
              </label>
              <input
                id="max_uses"
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Kosongkan = tidak terbatas"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="valid_until" className={labelClass}>
                Tanggal Kedaluwarsa (Opsional)
              </label>
              <input
                id="valid_until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold py-2.5 rounded-xl transition-all text-sm mt-2"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              Buat Voucher
            </button>
          </form>
        </div>

        {/* Vouchers List */}
        <div className="md:col-span-8 flex flex-col gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-white font-bold">Daftar Voucher</h2>
              <span className="text-gray-500 text-xs">
                {vouchers.length} Voucher
              </span>
            </div>

            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={24} />
              </div>
            ) : vouchers.length === 0 ? (
              <p className="p-8 text-center text-gray-500 text-sm">
                Belum ada voucher
              </p>
            ) : (
              <div className="divide-y divide-gray-800">
                {vouchers.map((v) => (
                  <div
                    key={v.id}
                    className="px-5 py-4 flex items-center justify-between hover:bg-gray-950/40 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Ticket size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-bold tracking-wide uppercase">
                            {v.code}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.is_active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-gray-850 text-gray-500 border border-gray-800"}`}
                          >
                            {v.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                        <p className="text-gray-300 text-xs mt-1">
                          Diskon:{" "}
                          <span className="text-emerald-400 font-semibold">
                            {v.discount_type === "percentage"
                              ? `${v.discount_value}%`
                              : formatPrice(v.discount_value)}
                          </span>
                          {v.min_purchase > 0 &&
                            ` | Min. Beli: ${formatPrice(v.min_purchase)}`}
                          {v.max_uses &&
                            ` | Maks. Pakai: ${v.used_count ?? 0}/${v.max_uses}x`}
                        </p>
                        {v.valid_until && (
                          <p className="text-gray-500 text-[10px] mt-0.5">
                            Berlaku hingga:{" "}
                            {new Date(v.valid_until).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleActive(v.id, v.is_active)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${v.is_active ? "border-gray-850 text-gray-400 hover:text-white hover:bg-gray-800" : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white"}`}
                      >
                        {v.is_active ? "Nonaktifkan" : "AAAktifkan"}
                      </button>
                      <button
                        onClick={() => handleDelete(v.id)}
                        disabled={deletingId === v.id}
                        className="text-gray-500 hover:text-red-400 p-2 transition-colors disabled:opacity-50"
                      >
                        {deletingId === v.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
