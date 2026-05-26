"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Loader2, X, Upload, AlertCircle, Package, Layers, Tag, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, getProductImageUrl } from "@/lib/utils";
import type { Product } from "@/types";
import ProductVariantsModal from "@/components/admin/product-variants-modal";

// ── Product Form Modal ─────────────────────────────────────────────────────

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

function ProductFormModal({ product, onClose, onSaved }: ProductFormProps) {
  const isEditing = !!product;
  const supabase = createClient();

  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price?.toString() ?? "",
    category: product?.category ?? "Kukus",
    spicy_level: product?.spicy_level?.toString() ?? "0",
    stock: product?.stock?.toString() ?? "",
    image_url: product?.image_url ?? "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.image_url ? getProductImageUrl(product.image_url) : null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (data) {
        setCategories(data);
        if (!product && data.length > 0) {
          setForm((prev) => ({ ...prev, category: data[0].name }));
        }
      }
    }
    loadCategories();
  }, [supabase, product]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let imageUrl = form.image_url;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("products").upload(filename, imageFile, { upsert: true });
        if (uploadError) throw new Error(`Gagal upload: ${uploadError.message}`);
        const { data: publicData } = supabase.storage.from("products").getPublicUrl(filename);
        imageUrl = publicData.publicUrl;
      }
      const payload = { name: form.name, description: form.description, price: parseInt(form.price, 10), category: form.category, spicy_level: parseInt(form.spicy_level, 10), stock: parseInt(form.stock, 10), image_url: imageUrl };
      if (isEditing) {
        const { error } = await supabase.from("products").update(payload).eq("id", product!.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw new Error(error.message);
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const labelClass = "text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5";
  const inputClass = "w-full bg-gray-900/50 border border-gray-700/50 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 placeholder:text-gray-600";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111] border border-gray-800 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl shadow-emerald-500/5">
        <div className="flex items-center justify-between p-6 border-b border-gray-800/50 bg-gray-900/20">
          <div>
            <h2 className="text-white font-bold text-xl">{isEditing ? "Edit Produk" : "Tambah Produk"}</h2>
            <p className="text-gray-500 text-xs mt-1">Lengkapi informasi produk di bawah ini</p>
          </div>
          <button onClick={onClose} className="bg-gray-800/50 text-gray-400 hover:text-white p-2 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex flex-col gap-6">
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-2xl">
              <AlertCircle size={18} className="shrink-0" />{error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 flex flex-col gap-3">
              <label className={labelClass}>Foto Produk</label>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-900 border-2 border-dashed border-gray-800 group hover:border-emerald-500/50 transition-all">
                {imagePreview ? (
                  <Image src={imagePreview} alt="Preview" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                    <Package size={32} strokeWidth={1.5} className="mb-2" />
                    <span className="text-[10px] uppercase font-bold tracking-tighter">No Preview</span>
                  </div>
                )}
                <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white text-black p-2 rounded-full"><Upload size={16} /></div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
              <p className="text-[10px] text-gray-500 text-center italic">Rasio 1:1 direkomendasikan</p>
            </div>

            <div className="md:col-span-8 flex flex-col gap-5">
              <div>
                <label htmlFor="name" className={labelClass}><Tag size={12}/> Nama Produk</label>
                <input id="name" name="name" type="text" value={form.name} onChange={handleChange} required className={inputClass} placeholder="Contoh: Dimsum Mentai Premium" />
              </div>
              <div>
                <label htmlFor="description" className={labelClass}><Info size={12}/> Deskripsi</label>
                <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3} className={`${inputClass} resize-none`} placeholder="Jelaskan kelezatan produk Anda..." />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label htmlFor="price" className={labelClass}>Harga (IDR)</label>
              <input id="price" name="price" type="number" value={form.price} onChange={handleChange} required min="0" className={inputClass} placeholder="0" />
            </div>
            <div className="col-span-2">
              <label htmlFor="stock" className={labelClass}>Stok Unit</label>
              <input id="stock" name="stock" type="number" value={form.stock} onChange={handleChange} required min="0" className={inputClass} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className={labelClass}><Layers size={12}/> Kategori</label>
              <select id="category" name="category" value={form.category} onChange={handleChange} className={inputClass}>
                {categories.map((c) => (
                  <option key={c.id} value={c.name} className="bg-gray-900">{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="spicy_level" className={labelClass}>Tingkat Pedas</label>
              <select id="spicy_level" name="spicy_level" value={form.spicy_level} onChange={handleChange} className={inputClass}>
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n} className="bg-gray-900">
                    {n === 0 ? "Normal / Tidak Pedas" : `${"🌶️".repeat(n)} Level ${n}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-gray-800/50">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-all font-medium text-sm">
              Batalkan
            </button>
            <button type="submit" disabled={saving} className="flex-[1.5] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95">
              {saving ? <Loader2 size={18} className="animate-spin" /> : null}
              {saving ? "Memproses..." : isEditing ? "Perbarui Produk" : "Terbitkan Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Products Page ─────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const supabase = createClient();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function handleDelete(id: string) {
    if (!confirm("Hapus produk ini secara permanen?")) return;
    setDeletingId(id);
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Katalog Produk</h1>
          <p className="text-gray-500 mt-1 font-medium">Kelola inventaris menu Anda dengan mudah</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-white font-bold text-lg leading-none">{products.length}</span>
            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Total Produk</span>
          </div>
          <button onClick={() => setShowForm(true)} className="group flex items-center gap-2 bg-white hover:bg-gray-100 text-black font-bold px-6 py-3 rounded-2xl transition-all shadow-xl active:scale-95">
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            Tambah Produk Baru
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
            <Loader2 className="animate-spin text-emerald-500 relative" size={40} />
          </div>
          <p className="text-gray-500 font-medium animate-pulse">Memuat katalog...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-gray-900/30 border-2 border-dashed border-gray-800 rounded-3xl py-24 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6">
            <Package size={32} className="text-gray-600" />
          </div>
          <h3 className="text-white font-bold text-xl">Dapur Masih Kosong</h3>
          <p className="text-gray-500 max-w-xs mt-2">Mulai tambahkan menu andalan Anda untuk ditampilkan di aplikasi pelanggan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 overflow-hidden">
          <div className="hidden md:grid grid-cols-[80px_1fr_140px_140px_100px_120px] gap-6 px-8 py-4 bg-gray-900/50 border border-gray-800/50 rounded-2xl text-[11px] font-extrabold uppercase tracking-[0.2em] text-gray-500">
            <span>Foto</span><span>Detail Produk</span><span>Kategori</span><span>Harga</span><span>Status</span><span className="text-right">Aksi</span>
          </div>

          <div className="flex flex-col gap-3">
            {products.map((product) => (
              <div key={product.id} className="group grid grid-cols-1 md:grid-cols-[80px_1fr_140px_140px_100px_120px] items-center gap-4 md:gap-6 px-4 md:px-8 py-4 bg-gray-900/20 hover:bg-gray-900/50 border border-gray-800/50 hover:border-gray-700 rounded-2xl transition-all duration-300">
                <div className="relative w-16 h-16 md:w-14 md:h-14 rounded-xl overflow-hidden bg-gray-800 border border-gray-700/50 shadow-inner">
                  {product.image_url && <Image src={getProductImageUrl(product.image_url)} alt={product.name} fill sizes="60px" className="object-cover group-hover:scale-110 transition-transform duration-500" />}
                </div>
                <div className="min-w-0">
                  <h4 className="text-white font-bold text-base md:text-sm group-hover:text-emerald-400 transition-colors truncate">{product.name}</h4>
                  <p className="text-gray-500 text-xs mt-1 line-clamp-1 italic font-light">{product.description || "Tidak ada deskripsi"}</p>
                </div>
                <div className="hidden md:block">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-800/80 text-gray-300 text-[10px] font-bold uppercase tracking-wider border border-gray-700">{product.category}</span>
                </div>
                <div className="flex md:block items-center justify-between border-t border-gray-800 pt-3 md:pt-0 md:border-0">
                  <span className="md:hidden text-[10px] font-bold text-gray-600 uppercase">Harga</span>
                  <span className="text-white font-extrabold text-sm md:text-base">{formatPrice(product.price)}</span>
                </div>
                <div className="flex md:block items-center justify-between">
                  <span className="md:hidden text-[10px] font-bold text-gray-600 uppercase">Stok</span>
                  <div className={`px-3 py-1 rounded-lg inline-flex items-center gap-1.5 ${product.stock === 0 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${product.stock === 0 ? "bg-red-500" : "bg-emerald-500"}`} />
                    <span className="text-xs font-bold">{product.stock} <span className="opacity-60 text-[10px]">Pcs</span></span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-gray-800 pt-3 md:pt-0 md:border-0">
                  <button onClick={() => setVariantProduct(product)} className="p-2.5 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all" title="Varian">
                    <Layers size={16} />
                  </button>
                  <button onClick={() => { setEditingProduct(product); setShowForm(true); }} className="p-2.5 bg-blue-500/5 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all" title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(product.id)} disabled={deletingId === product.id} className="p-2.5 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all disabled:opacity-30" title="Hapus">
                    {deletingId === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSaved={() => { setShowForm(false); setEditingProduct(null); fetchProducts(); }}
        />
      )}

      {variantProduct && (
        <ProductVariantsModal
          product={variantProduct}
          onClose={() => setVariantProduct(null)}
        />
      )}
    </div>
  );
}