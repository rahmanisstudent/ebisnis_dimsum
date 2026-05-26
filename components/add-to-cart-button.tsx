"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Minus, Plus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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

  const router = useRouter();
  const supabase = createClient();

  // Load variants on mount
  useEffect(() => {
    async function loadVariants() {
      const { data } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product.id)
        .order("name", { ascending: true });
      if (data && data.length > 0) {
        setVariants(data);
        // Find first variant with stock > 0, otherwise default to first
        const available = data.find((v) => v.stock > 0) ?? data[0];
        setSelectedVariant(available);
      }
    }
    loadVariants();
  }, [product.id, supabase]);

  // Determine active stock and price
  const activeStock = selectedVariant ? selectedVariant.stock : product.stock;
  const activePrice = product.price + (selectedVariant ? selectedVariant.price_adjustment : 0);
  const isOutOfStock = activeStock === 0;
  const maxQty = Math.min(activeStock, 10);

  // Keep quantity within bounds if selected variant changes
  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(q, 1), Math.max(maxQty, 1)));
  }, [selectedVariant, maxQty]);

  function increment() { setQuantity((q) => Math.min(q + 1, maxQty)); }
  function decrement() { setQuantity((q) => Math.max(q - 1, 1)); }

  async function ensureCart(userId: string): Promise<string | null> {
    const { data: existing } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) return existing.id;

    const { data: newCart, error } = await supabase
      .from("carts")
      .insert({ user_id: userId })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create cart:", error);
      return null;
    }
    return newCart.id;
  }

  async function handleAddToCart() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    startTransition(async () => {
      setErrorMsg(null);
      try {
        const cartId = await ensureCart(user.id);
        if (!cartId) throw new Error("Gagal memuat keranjang belanja.");

        // Query existing cart items checking product_id AND variant_id
        let itemQuery = supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("cart_id", cartId)
          .eq("product_id", product.id);

        if (selectedVariant) {
          itemQuery = itemQuery.eq("variant_id", selectedVariant.id);
        } else {
          itemQuery = itemQuery.is("variant_id", null);
        }

        const { data: existing } = await itemQuery.single();

        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, maxQty);
          const { error: updateError } = await supabase
            .from("cart_items")
            .update({ quantity: newQty })
            .eq("id", existing.id);
          if (updateError) throw new Error(updateError.message);
        } else {
          const { error: insertError } = await supabase.from("cart_items").insert({
            cart_id: cartId,
            product_id: product.id,
            variant_id: selectedVariant ? selectedVariant.id : null,
            quantity,
          });
          if (insertError) throw new Error(insertError.message);
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

  return (
    <div className="flex flex-col gap-5">
      {/* Variants Selection Pills */}
      {variants.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">Pilih Varian</span>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const vOutOfStock = v.stock === 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={vOutOfStock}
                  onClick={() => setSelectedVariant(v)}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 flex flex-col items-start gap-0.5",
                    isSelected
                      ? "border-primary bg-primary-light text-primary-dark"
                      : vOutOfStock
                      ? "border-border-soft bg-gray-50 text-gray-400 cursor-not-allowed opacity-50"
                      : "border-border-soft hover:border-text-muted text-text-main bg-white"
                  )}
                >
                  <span className="font-bold">{v.name}</span>
                  <span className="text-[10px] opacity-80">
                    {v.price_adjustment !== 0
                      ? `${v.price_adjustment >= 0 ? "+" : ""}${formatPrice(v.price_adjustment)}`
                      : "Harga Normal"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Pricing Highlight if Variant Selected */}
      {selectedVariant && (
        <div className="bg-cream/50 rounded-2xl p-4 border border-border-soft/60">
          <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Harga Varian Terpilih</p>
          <p className="text-2xl font-black text-accent mt-0.5">{formatPrice(activePrice)}</p>
          <p className="text-xs text-text-muted/80 mt-1">Stok varian {selectedVariant.name}: {activeStock} unit</p>
        </div>
      )}

      {/* Quantity selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-text-muted font-medium">Jumlah:</span>
        <div className="flex items-center border border-border-soft rounded-2xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={decrement}
            disabled={quantity <= 1 || isOutOfStock}
            className="w-10 h-10 flex items-center justify-center text-text-muted hover:bg-primary-light hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Minus size={15} />
          </button>
          <span className="w-10 text-center font-bold text-text-main text-sm">
            {quantity}
          </span>
          <button
            type="button"
            onClick={increment}
            disabled={quantity >= maxQty || isOutOfStock}
            className="w-10 h-10 flex items-center justify-center text-text-muted hover:bg-primary-light hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Error message */}
      {status === "error" && errorMsg && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-2xl border border-red-200">
          <AlertCircle size={15} className="shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Add to cart button */}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock || isPending}
        className={cn(
          "w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-base transition-all duration-300",
          isOutOfStock
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : status === "success"
            ? "bg-green-500 text-white shadow-lg shadow-green-200"
            : "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
        )}
      >
        {isPending ? (
          <><Loader2 size={18} className="animate-spin" />Menambahkan...</>
        ) : status === "success" ? (
          <><CheckCircle2 size={18} />Ditambahkan ke Keranjang!</>
        ) : (
          <>
            <ShoppingCart size={18} />
            {isOutOfStock
              ? "Stok Habis"
              : `Tambah ke Keranjang • ${formatPrice(quantity * activePrice)}`}
          </>
        )}
      </button>
    </div>
  );
}
