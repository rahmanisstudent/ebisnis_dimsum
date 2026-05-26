"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2, Loader2, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types";

interface Props {
  product: Product;
  onClose: () => void;
}

export default function ProductVariantsModal({ product, onClose }: Props) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [priceAdjustment, setPriceAdjustment] = useState("");
  const [stock, setStock] = useState("");

  const supabase = createClient();

  async function fetchVariants() {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id)
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setVariants((data as ProductVariant[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchVariants();
  }, [product.id]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    const adjustment = parseInt(priceAdjustment, 10) || 0;
    const stockVal = parseInt(stock, 10) || 0;

    const { error: insertError } = await supabase.from("product_variants").insert({
      product_id: product.id,
      name: name.trim(),
      price_adjustment: adjustment,
      stock: stockVal,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setName("");
      setPriceAdjustment("");
      setStock("");
      fetchVariants();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus varian ini?")) return;

    setDeletingId(id);
    setError(null);

    const { error: deleteError } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      fetchVariants();
    }
    setDeletingId(null);
  }

  const inputClass = "w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 placeholder:text-gray-600";
  const labelClass = "text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1";

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111] border border-gray-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <Layers className="text-emerald-500" size={20} />
            <div>
              <h2 className="text-white font-bold text-lg">Kelola Varian — {product.name}</h2>
              <p className="text-gray-500 text-xs mt-0.5">Tambah varian rasa/porsi untuk produk ini</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-gray-800 text-gray-400 hover:text-white p-2 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Add Variant Form */}
          <div className="md:col-span-5 bg-gray-900/30 border border-gray-850 p-5 rounded-2xl h-fit">
            <h3 className="text-white font-bold text-sm mb-4">Tambah Varian</h3>
            <form onSubmit={handleAdd} className="flex flex-col gap-3.5">
              <div className="flex flex-col">
                <label htmlFor="variant_name" className={labelClass}>Nama Varian</label>
                <input
                  id="variant_name"
                  type="text"
                  placeholder="Contoh: Keju, Pedas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="price_adj" className={labelClass}>Penyesuaian Harga (Rp)</label>
                <input
                  id="price_adj"
                  type="number"
                  placeholder="Contoh: 2000 (bisa negatif/0)"
                  value={priceAdjustment}
                  onChange={(e) => setPriceAdjustment(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="variant_stock" className={labelClass}>Stok Unit</label>
                <input
                  id="variant_stock"
                  type="number"
                  placeholder="Contoh: 10"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold py-2.5 rounded-xl transition-all text-sm mt-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Tambah Varian
              </button>
            </form>
          </div>

          {/* Variants List */}
          <div className="md:col-span-7 flex flex-col gap-3">
            <div className="bg-gray-900/30 border border-gray-850 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
                <h4 className="text-white font-bold text-xs">Varian Aktif</h4>
                <span className="text-gray-500 text-[10px] font-bold">{variants.length} Varian</span>
              </div>

              {loading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="animate-spin text-emerald-500" size={24} />
                </div>
              ) : variants.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">Belum ada varian produk ini</div>
              ) : (
                <div className="divide-y divide-gray-800/80">
                  {variants.map((v) => (
                    <div key={v.id} className="p-4 flex items-center justify-between hover:bg-gray-900/20">
                      <div>
                        <p className="text-white font-semibold text-sm">{v.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          Harga: {v.price_adjustment >= 0 ? "+" : ""}{formatPrice(v.price_adjustment)} | Stok: {v.stock}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(v.id)}
                        disabled={deletingId === v.id}
                        className="text-gray-500 hover:text-red-400 p-2 transition-colors disabled:opacity-50"
                      >
                        {deletingId === v.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
