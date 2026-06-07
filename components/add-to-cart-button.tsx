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

        // ── Dispatch cart update event so NavbarCart badge updates immediately ──
        window.dispatchEvent(new CustomEvent("cartUpdated"));
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
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ height: 16, width: 64, background: "#f0e8e4", borderRadius: 8 }} />
          <div style={{ height: 40, width: 128, background: "#f0e8e4", borderRadius: 12 }} />
        </div>
        <div style={{ height: 56, background: "#f0e8e4", borderRadius: 16 }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ── Variant Selector ── */}
      {variants.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6b6560", textTransform: "uppercase", letterSpacing: "0.8px" }}>
            Pilih Varian
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const vOut = v.stock === 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={vOut}
                  onClick={() => setSelectedVariant(v)}
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.8rem",
                    fontWeight: isSelected ? 700 : 600,
                    borderRadius: "10px",
                    border: `1.5px solid ${isSelected ? "#c0392b" : "#f0e8e4"}`,
                    background: isSelected ? "#fef2f2" : vOut ? "#f9f9f9" : "#fff",
                    color: isSelected ? "#c0392b" : vOut ? "#bbb" : "#2d2a26",
                    cursor: vOut ? "not-allowed" : "pointer",
                    opacity: vOut ? 0.5 : 1,
                    transition: "all 0.15s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "0.125rem",
                    textDecoration: "none",
                  }}
                >
                  <span>{v.name}</span>
                  <span style={{ fontSize: "0.68rem", opacity: 0.8 }}>
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

      {/* ── Selected Variant Price Display ── */}
      {selectedVariant && (
        <div style={{ background: "#fdf6f0", borderRadius: "14px", padding: "1rem", border: "1px solid #f0e8e4" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6b6560", textTransform: "uppercase", letterSpacing: "0.8px" }}>
            Harga Varian Terpilih
          </p>
          <p style={{ fontSize: "1.5rem", fontWeight: 900, color: "#c0392b", marginTop: "0.25rem" }}>
            {formatPrice(activePrice)}
          </p>
          <p style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "0.25rem" }}>
            Stok: {activeStock} unit
          </p>
        </div>
      )}

      {/* ── Quantity Selector ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span style={{ fontSize: "0.875rem", color: "#6b6560", fontWeight: 500 }}>Jumlah:</span>
        <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #f0e8e4", borderRadius: "50px", overflow: "hidden", background: "#fff" }}>
          <button
            type="button"
            onClick={decrement}
            disabled={quantity <= 1 || isOutOfStock}
            style={{
              width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
              background: "none", border: "none", cursor: quantity <= 1 ? "not-allowed" : "pointer",
              color: "#6b6560", opacity: quantity <= 1 || isOutOfStock ? 0.3 : 1, transition: "all 0.15s",
            }}
          >
            <Minus size={15} />
          </button>
          <span style={{ width: 40, textAlign: "center", fontSize: "0.9rem", fontWeight: 700, color: "#1a1a1a" }}>
            {quantity}
          </span>
          <button
            type="button"
            onClick={increment}
            disabled={quantity >= maxQty || isOutOfStock}
            style={{
              width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
              background: "none", border: "none", cursor: quantity >= maxQty ? "not-allowed" : "pointer",
              color: "#6b6560", opacity: quantity >= maxQty || isOutOfStock ? 0.3 : 1, transition: "all 0.15s",
            }}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* ── Error message ── */}
      {status === "error" && errorMsg && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#fef2f2", color: "#dc2626", fontSize: "0.875rem", padding: "0.625rem 1rem", borderRadius: "12px", border: "1px solid #fecaca" }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />{errorMsg}
        </div>
      )}

      {/* ── Main CTA ── */}
      {isLoggedIn ? (
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isPending}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.625rem",
            padding: "1rem 1.5rem",
            borderRadius: "14px",
            border: "none",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: isOutOfStock || isPending ? "not-allowed" : "pointer",
            background: isOutOfStock
              ? "#f0e8e4"
              : status === "success"
              ? "#22c55e"
              : "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
            color: isOutOfStock ? "#9ca3af" : "#fff",
            boxShadow: isOutOfStock ? "none" : status === "success" ? "0 4px 14px rgba(34,197,94,0.3)" : "0 4px 14px rgba(192,57,43,0.35)",
            transition: "all 0.25s",
            transform: "translateY(0)",
          }}
        >
          {isPending ? (
            <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />Menambahkan...</>
          ) : status === "success" ? (
            <><CheckCircle2 size={18} />Ditambahkan ke Keranjang!</>
          ) : (
            <><ShoppingCart size={18} />{isOutOfStock ? "Stok Habis" : `Tambah ke Keranjang • ${formatPrice(quantity * activePrice)}`}</>
          )}
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.625rem",
              padding: "1rem 1.5rem",
              borderRadius: "14px",
              border: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: isOutOfStock ? "not-allowed" : "pointer",
              background: isOutOfStock ? "#f0e8e4" : "linear-gradient(135deg, #f5a623 0%, #f08c00 100%)",
              color: isOutOfStock ? "#9ca3af" : "#fff",
              boxShadow: isOutOfStock ? "none" : "0 4px 14px rgba(245,166,35,0.35)",
              transition: "all 0.25s",
            }}
          >
            <Zap size={18} />
            {isOutOfStock ? "Stok Habis" : `Beli Sekarang • ${formatPrice(quantity * activePrice)}`}
          </button>
          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#6b6560" }}>
            Punya akun?{" "}
            <a href="/login" style={{ color: "#c0392b", fontWeight: 700, textDecoration: "none" }}>Masuk</a>
            {" "}untuk tambah ke keranjang & simpan riwayat pesanan.
          </p>
        </div>
      )}
    </div>
  );
}
