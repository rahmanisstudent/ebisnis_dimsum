"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, FolderHeart, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const supabase = createClient();

  async function fetchCategories() {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setCategories((data as Category[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from("categories").insert({
      name: name.trim(),
      emoji: emoji.trim() || null,
      sort_order: sortOrder,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setName("");
      setEmoji("");
      setSortOrder(0);
      fetchCategories();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus kategori ini?")) return;

    setDeletingId(id);
    setError(null);

    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      fetchCategories();
    }
    setDeletingId(null);
  }

  const inputClass = "w-full border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-gray-900 text-white";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <FolderHeart className="text-emerald-500" size={28} />
        <h1 className="text-2xl font-extrabold text-white">Kelola Kategori</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-2xl mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 h-fit">
          <h2 className="text-white font-bold mb-4">Tambah Kategori</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="category_name" className="text-xs font-semibold text-gray-400">Nama Kategori</label>
              <input
                id="category_name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Saus, Camilan"
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="category_emoji" className="text-xs font-semibold text-gray-400">Emoji (Opsional)</label>
              <input
                id="category_emoji"
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="Contoh: 🌶️, 🍢"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="category_order" className="text-xs font-semibold text-gray-400">Urutan (Sort Order)</label>
              <input
                id="category_order"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold py-2.5 rounded-xl transition-all text-sm mt-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Tambah Kategori
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="md:col-span-2">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-white font-bold">Daftar Kategori</h2>
              <span className="text-gray-500 text-xs">{categories.length} Kategori</span>
            </div>

            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={24} />
              </div>
            ) : categories.length === 0 ? (
              <p className="p-8 text-center text-gray-500 text-sm">Belum ada kategori</p>
            ) : (
              <div className="divide-y divide-gray-800">
                {categories.map((cat) => (
                  <div key={cat.id} className="px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl bg-gray-950 w-10 h-10 rounded-xl flex items-center justify-center border border-gray-800">
                        {cat.emoji ?? "📁"}
                      </span>
                      <div>
                        <p className="text-white text-sm font-semibold">{cat.name}</p>
                        <p className="text-gray-500 text-xs">Urutan: {cat.sort_order}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id}
                      className="text-gray-500 hover:text-red-400 p-2 transition-colors disabled:opacity-50"
                    >
                      {deletingId === cat.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
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
