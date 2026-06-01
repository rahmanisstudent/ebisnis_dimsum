"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  PackageOpen,
  Loader2,
  CheckSquare,
  Square,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, getProductImageUrl, cn } from "@/lib/utils";
import type { CartItem, Product } from "@/types";
import NavbarCart from "@/components/navbar-cart";

interface CartItemWithProduct extends CartItem {
  product: Product;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const supabase = createClient();
  const router = useRouter();

  const fetchCart = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
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

    const { data } = await supabase
      .from("cart_items")
      .select("*, product:products(*)")
      .eq("cart_id", cart.id)
      .order("created_at", { ascending: true });

    const fetched = (data as CartItemWithProduct[]) ?? [];
    setItems(fetched);
    setSelectedIds(new Set(fetched.map((i) => i.id)));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const noneSelected = selectedIds.size === 0;

  function toggleAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map((i) => i.id)));
  }

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function updateQuantity(itemId: string, newQty: number) {
    setUpdatingId(itemId);
    await supabase
      .from("cart_items")
      .update({ quantity: newQty })
      .eq("id", itemId);
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQty } : item,
      ),
    );
    setUpdatingId(null);
  }

  async function removeItem(itemId: string) {
    setUpdatingId(itemId);
    await supabase.from("cart_items").delete().eq("id", itemId);
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    setUpdatingId(null);
  }

  const selectedItems = items.filter((i) => selectedIds.has(i.id));
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const shipping = subtotal > 0 ? 15000 : 0;
  const total = subtotal + shipping;

  function handleCheckout() {
    if (noneSelected) return;
    const ids = [...selectedIds].join(",");
    router.push(`/checkout?items=${ids}`);
  }

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
              <span className="text-primary">DimSum</span>
              <span className="text-accent">Store</span>
            </span>
          </Link>
          <NavbarCart />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-text-main mb-6">
          🛒 Keranjang Belanja
        </h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-primary-light rounded-full flex items-center justify-center mb-6">
              <PackageOpen className="text-primary" size={40} />
            </div>
            <h2 className="text-xl font-bold text-text-main mb-2">
              Keranjang kamu kosong
            </h2>
            <p className="text-text-muted text-sm mb-8">
              Yuk, tambahkan dimsum favorit kamu!
            </p>
            <Link
              href="/"
              className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20"
            >
              Lihat Menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-3">
              <div className="surface-card px-4 py-3 flex items-center justify-between">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-2.5 text-sm font-semibold text-text-main hover:text-primary transition-colors duration-200"
                >
                  {allSelected ? (
                    <CheckSquare size={20} className="text-primary" />
                  ) : (
                    <Square size={20} className="text-border-soft" />
                  )}
                  {allSelected ? "Batal Pilih Semua" : "Pilih Semua"}
                </button>
                {!noneSelected && (
                  <span className="text-xs text-text-muted font-medium">
                    {selectedIds.size} dari {items.length} item dipilih
                  </span>
                )}
              </div>

              {items.map((item) => {
                const isUpdating = updatingId === item.id;
                const isSelected = selectedIds.has(item.id);
                const maxQty = Math.min(item.product.stock, 10);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "surface-card p-4 flex gap-3 transition-all duration-200",
                      isSelected
                        ? "border-primary/30 shadow-sm"
                        : "border-border-soft opacity-60",
                      isUpdating && "opacity-50",
                    )}
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="shrink-0 mt-1"
                    >
                      {isSelected ? (
                        <CheckSquare size={20} className="text-primary" />
                      ) : (
                        <Square size={20} className="text-border-soft" />
                      )}
                    </button>

                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-cream shrink-0">
                      <Image
                        src={getProductImageUrl(item.product.image_url)}
                        alt={item.product.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-text-main text-sm leading-snug line-clamp-2">
                            {item.product.name}
                          </h3>
                          <span className="text-xs text-text-muted mt-0.5 block">
                            {item.product.category}
                          </span>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={isUpdating}
                          className="text-border-soft hover:text-red-500 transition-colors duration-200 shrink-0 p-1"
                          aria-label="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-border-soft rounded-2xl overflow-hidden">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1 || isUpdating}
                            className="w-8 h-8 flex items-center justify-center text-text-muted hover:bg-primary-light hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-text-main">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={item.quantity >= maxQty || isUpdating}
                            className="w-8 h-8 flex items-center justify-center text-text-muted hover:bg-primary-light hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <span className="font-extrabold text-accent text-sm">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <Link
                href="/"
                className="flex items-center gap-2 text-primary font-semibold text-sm hover:underline mt-1"
              >
                + Tambah item lain
              </Link>
            </div>

            <div className="lg:col-span-1">
              <div className="surface-card p-6 sticky top-24">
                <h2 className="font-extrabold text-text-main text-lg mb-5">
                  Ringkasan Pesanan
                </h2>
                {noneSelected ? (
                  <p className="text-sm text-text-muted text-center py-4">
                    Pilih minimal 1 item untuk melanjutkan
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="text-xs text-text-muted mb-1">
                      {selectedIds.size} item dipilih
                    </div>
                    <div className="flex justify-between text-text-muted">
                      <span>Subtotal</span>
                      <span className="font-semibold text-text-main">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-text-muted">
                      <span>Ongkos Kirim</span>
                      <span className="font-semibold text-text-main">
                        {formatPrice(shipping)}
                      </span>
                    </div>
                    <div className="border-t border-dashed border-border-soft my-1" />
                    <div className="flex justify-between text-text-main font-extrabold text-base">
                      <span>Total</span>
                      <span className="text-accent">{formatPrice(total)}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={noneSelected}
                  className={cn(
                    "w-full mt-6 flex items-center justify-center gap-2 font-bold py-4 rounded-2xl transition-all duration-300",
                    noneSelected
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0",
                  )}
                >
                  Lanjut ke Pembayaran
                  {!noneSelected && (
                    <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                      {selectedIds.size}
                    </span>
                  )}
                  <ArrowRight size={18} />
                </button>

                <p className="text-center text-xs text-text-muted mt-3">
                  Pembayaran aman via Midtrans 🔒
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
