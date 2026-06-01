"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Minus,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  product: Product;
}

/**
 * Client Component: handles quantity selection and "Add to Cart" action.
 * Includes cart-creation fallback: if no cart row exists for the user, creates one.
 */
export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const isOutOfStock = product.stock === 0;
  const maxQty = Math.min(product.stock, 10);

  function increment() {
    setQuantity((q) => Math.min(q + 1, maxQty));
  }
  function decrement() {
    setQuantity((q) => Math.max(q - 1, 1));
  }

  async function ensureCart(userId: string): Promise<string | null> {
    // Try to get existing cart
    const { data: existing } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) return existing.id;

    // No cart exists — create one (fallback if trigger didn't run)
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

        // Upsert — increment if product already in cart
        const { data: existing } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("cart_id", cartId)
          .eq("product_id", product.id)
          .single();

        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, maxQty);
          await supabase
            .from("cart_items")
            .update({ quantity: newQty })
            .eq("id", existing.id);
        } else {
          await supabase.from("cart_items").insert({
            cart_id: cartId,
            product_id: product.id,
            quantity,
          });
        }

        setStatus("success");
        router.refresh(); // refresh server components (updates cart count in navbar)
        setTimeout(() => setStatus("idle"), 2500);
      } catch (err) {
        setStatus("error");
        setErrorMsg((err as Error).message);
        setTimeout(() => setStatus("idle"), 3000);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Quantity selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-text-muted font-medium">Jumlah:</span>
        <div className="flex items-center border border-border-soft rounded-2xl overflow-hidden">
          <button
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
              : "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0",
        )}
      >
        {isPending ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Menambahkan...
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle2 size={18} />
            Ditambahkan ke Keranjang!
          </>
        ) : (
          <>
            <ShoppingCart size={18} />
            {isOutOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
          </>
        )}
      </button>
    </div>
  );
}
