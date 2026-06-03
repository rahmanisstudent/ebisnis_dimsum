"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Minus, Plus, Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Product, ProductVariant } from "@/types";
import { cn, formatPrice } from "@/lib/utils";

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // null = still checking, true/false = result
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const router = useRouter();
  const supabase = createClient();

  // ── Auth check on mount ───────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load variants ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadVariants() {
      const { data } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product.id)
        .order("name", { ascending: true });
      if (data && data.length > 0) {
        setVariants(data);
        setSelectedVariant(data.find((v) => v.stock > 0) ?? data[0]);
      }
    }
    loadVariants();
  }, [product.id]);

  const activeStock = selectedVariant ? selectedVariant.stock : product.stock;
  const activePrice = product.price + (selectedVariant?.price_adjustment ?? 0);
  const isOutOfStock = activeStock === 0;
  const maxQty = Math.min(activeStock, 10);

  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(q, 1), Math.max(maxQty, 1)));
  }, [selectedVariant, maxQty]);

  function increment() { setQuantity((q) => Math.min(q + 1, maxQty)); }
  function decrement() { setQuantity((q) => Math.max(q - 1, 1)); }

  // ── Authenticated: ensureCart ─────────────────────────────────────────────
  async function ensureCart(userId: string): Promise<string | null> {
    const { data: existing } = await supabase.from("carts").select("id").eq("user_id", userId).single();
    if (existing) return existing.id;
    const { data: newCart, error } = await supabase.from("carts").insert({ user_id: userId }).select("id").single();
    return error ? null : newCart.id;
  }

  // ── Authenticated: Add to Cart ────────────────────────────────────────────
  async function handleAddToCart() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    startTransition(async () => {
      setErrorMsg(null);
      try {
        const cartId = await ensureCart(user.id);
        if (!cartId) throw new Error("Gagal memuat keranjang belanja.");

        let q = supabase.from("cart_items").select("id, quantity")
          .eq("cart_id", cartId).eq("product_id", product.id);
        q = selectedVariant ? q.eq("variant_id", selectedVariant.id) : q.is("variant_id", null);
        const { data: existing } = await q.single();

        if (existing) {
          const { error } = await supabase.from("cart_items")
            .update({ quantity: Math.min(existing.quantity + quantity, maxQty) })
            .eq("id", existing.id);
          if (error) throw new Error(error.message);
        } else {
          const { error } = await supabase.from("cart_items").insert({
            cart_id: cartId,
            product_id: product.id,
            variant_id: selectedVariant?.id ?? null,
            quantity,
          });
          if (error) throw new Error(error.message);
        }

        setStatus("success");
        router.refresh();
        setTimeout(() => setStatus("idle"), 2500);
      } catch (err) {
        setStatus("error");
        setErrorMsg((err as Error).message);
        setTimeout(() => setStatus("idle"), 3000);
      }
    });
  }

  // ── Guest: Buy Now → /guest-checkout ─────────────────────────────────────
  function handleBuyNow() {
    const params = new URLSearchParams({ product_id: product.id, quantity: quantity.toString() });
    if (selectedVariant) params.set("variant_id", selectedVariant.id);
    router.push(`/guest-checkout?${params.toString()}`);
  }

  // ── Loading skeleton while auth is checked ────────────────────────────────
  if (isLoggedIn === null) {
    return (
      <div className="flex flex-col gap-5 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-4 w-16 bg-gray-100 rounded" />
          <div className="h-10 w-32 bg-gray-100 rounded-2xl" />
        </div>
        <div className="h-14 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Variants */}
      {variants.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">Pilih Varian</span>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const vOut = v.stock === 0;
              return (
                <button key={v.id} type="button" disabled={vOut} onClick={() => setSelectedVariant(v)}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 flex flex-col items-start gap-0.5",
                    isSelected ? "border-primary bg-primary-light text-primary-dark"
                      : vOut ? "border-border-soft bg-gray-50 text-gray-400 cursor-not-allowed opacity-50"
                      : "border-border-soft hover:border-text-muted text-text-main bg-white"
                  )}>
                  <span className="font-bold">{v.name}</span>
                  <span className="text-[10px] opacity-80">
                    {v.price_adjustment !== 0 ? `${v.price_adjustment >= 0 ? "+" : ""}${formatPrice(v.price_adjustment)}` : "Harga Normal"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected variant price */}
      {selectedVariant && (
        <div className="bg-cream/50 rounded-2xl p-4 border border-border-soft/60">
          <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Harga Varian Terpilih</p>
          <p className="text-2xl font-black text-accent mt-0.5">{formatPrice(activePrice)}</p>
          <p className="text-xs text-text-muted/80 mt-1">Stok: {activeStock} unit</p>
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-text-muted font-medium">Jumlah:</span>
        <div className="flex items-center border border-border-soft rounded-2xl overflow-hidden bg-white">
          <button type="button" onClick={decrement} disabled={quantity <= 1 || isOutOfStock}
            className="w-10 h-10 flex items-center justify-center text-text-muted hover:bg-primary-light hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200">
            <Minus size={15} />
          </button>
          <span className="w-10 text-center font-bold text-text-main text-sm">{quantity}</span>
          <button type="button" onClick={increment} disabled={quantity >= maxQty || isOutOfStock}
            className="w-10 h-10 flex items-center justify-center text-text-muted hover:bg-primary-light hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200">
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Error */}
      {status === "error" && errorMsg && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-2xl border border-red-200">
          <AlertCircle size={15} className="shrink-0" />{errorMsg}
        </div>
      )}

      {/* ── Main button: Add to Cart (auth) or Buy Now (guest) ── */}
      {isLoggedIn ? (
        <button onClick={handleAddToCart} disabled={isOutOfStock || isPending}
          className={cn(
            "w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-base transition-all duration-300",
            isOutOfStock ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : status === "success" ? "bg-green-500 text-white shadow-lg shadow-green-200"
              : "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
          )}>
          {isPending ? <><Loader2 size={18} className="animate-spin" />Menambahkan...</>
            : status === "success" ? <><CheckCircle2 size={18} />Ditambahkan ke Keranjang!</>
            : <><ShoppingCart size={18} />{isOutOfStock ? "Stok Habis" : `Tambah ke Keranjang • ${formatPrice(quantity * activePrice)}`}</>}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <button onClick={handleBuyNow} disabled={isOutOfStock}
            className={cn(
              "w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-base transition-all duration-300",
              isOutOfStock ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-accent hover:bg-orange-600 text-white shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:-translate-y-0.5 active:translate-y-0"
            )}>
            <Zap size={18} />
            {isOutOfStock ? "Stok Habis" : `Beli Sekarang • ${formatPrice(quantity * activePrice)}`}
          </button>
          <p className="text-center text-xs text-text-muted">
            Punya akun?{" "}
            <a href="/login" className="text-primary font-semibold hover:underline">Masuk</a>
            {" "}untuk tambah ke keranjang & simpan riwayat pesanan.
          </p>
        </div>
      )}
    </div>
  );
}
