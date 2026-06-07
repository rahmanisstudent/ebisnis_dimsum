"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Minus, Plus, ArrowRight, PackageOpen, Loader2, CheckSquare, Square, ChefHat, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, getProductImageUrl, cn } from "@/lib/utils";
import type { CartItem, Product, ProductVariant } from "@/types";
import NavbarCart from "@/components/navbar-cart";
import SharedFooter from "@/components/shared-footer";

interface CartItemWithProduct extends Omit<CartItem, "variant"> {
  product: Product;
  variant: ProductVariant | null;
}

export default function CartPage() {
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const supabase = createClient();
  const router = useRouter();

  const fetchCart = useCallback(async () => {
    setLoading(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    if (!currentUser) {
      // ── Guest Cart (localStorage) ──
      try {
        const localCart = JSON.parse(localStorage.getItem("guest_cart") ?? "[]");
        if (localCart.length === 0) {
          setItems([]);
          setLoading(false);
          return;
        }

        const productIds = localCart.map((i: any) => i.product_id);
        const { data: dbProducts } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds);

        const variantIds = localCart.filter((i: any) => i.variant_id).map((i: any) => i.variant_id);
        const variantsMap: Record<string, ProductVariant> = {};
        if (variantIds.length > 0) {
          const { data: variantsData } = await supabase
            .from("product_variants")
            .select("*")
            .in("id", variantIds);
          (variantsData ?? []).forEach((v: ProductVariant) => {
            variantsMap[v.id] = v;
          });
        }

        const fetched = localCart.map((item: any, idx: number) => {
          const product = dbProducts?.find((p: any) => p.id === item.product_id);
          return {
            id: `guest-${idx}-${item.product_id}-${item.variant_id || ""}`,
            cart_id: "guest",
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            quantity: item.quantity,
            created_at: new Date().toISOString(),
            product: product || null,
            variant: item.variant_id ? (variantsMap[item.variant_id] ?? null) : null,
          };
        }).filter((item: any) => item.product !== null) as CartItemWithProduct[];

        setItems(fetched);
        setSelectedIds(new Set(fetched.map((i) => i.id)));
      } catch (e) {
        console.error("Failed to parse guest cart:", e);
        setItems([]);
      }
      setLoading(false);
      return;
    }

    // ── Logged In User Cart (Supabase) ──
    const { data: cart } = await supabase.from("carts").select("id").eq("user_id", currentUser.id).single();
    if (!cart) {
      setLoading(false);
      return;
    }

    const { data: cartItemsData, error: cartError } = await supabase
      .from("cart_items")
      .select("*, product:products(*)")
      .eq("cart_id", cart.id)
      .order("created_at", { ascending: true });

    if (cartError) {
      console.error("[Cart] Fetch error:", cartError.message);
      setLoading(false);
      return;
    }

    const rawItems = cartItemsData ?? [];

    const variantIds = [...new Set(
      rawItems.filter((i) => i.variant_id).map((i) => i.variant_id as string)
    )];
    const variantsMap: Record<string, ProductVariant> = {};
    if (variantIds.length > 0) {
      const { data: variantsData } = await supabase
        .from("product_variants")
        .select("*")
        .in("id", variantIds);
      (variantsData ?? []).forEach((v: ProductVariant) => {
        variantsMap[v.id] = v;
      });
    }

    const fetched = rawItems.map((item) => ({
      ...item,
      variant: item.variant_id ? (variantsMap[item.variant_id] ?? null) : null,
    })) as CartItemWithProduct[];

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
    if (user) {
      // Supabase
      await supabase.from("cart_items").update({ quantity: newQty }).eq("id", itemId);
    } else {
      // LocalStorage guest cart
      try {
        const localCart = JSON.parse(localStorage.getItem("guest_cart") ?? "[]");
        const targetItem = items.find((i) => i.id === itemId);
        if (targetItem) {
          const matchIdx = localCart.findIndex(
            (i: any) =>
              i.product_id === targetItem.product_id &&
              i.variant_id === targetItem.variant_id
          );
          if (matchIdx !== -1) {
            localCart[matchIdx].quantity = newQty;
            localStorage.setItem("guest_cart", JSON.stringify(localCart));
            // Trigger NavbarCart count update
            window.dispatchEvent(new Event("cartUpdated"));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity: newQty } : item)));
    setUpdatingId(null);
  }

  async function removeItem(itemId: string) {
    setUpdatingId(itemId);
    if (user) {
      // Supabase
      await supabase.from("cart_items").delete().eq("id", itemId);
    } else {
      // LocalStorage guest cart
      try {
        const localCart = JSON.parse(localStorage.getItem("guest_cart") ?? "[]");
        const targetItem = items.find((i) => i.id === itemId);
        if (targetItem) {
          const filtered = localCart.filter(
            (i: any) =>
              !(
                i.product_id === targetItem.product_id &&
                i.variant_id === targetItem.variant_id
              )
          );
          localStorage.setItem("guest_cart", JSON.stringify(filtered));
          // Trigger NavbarCart count update
          window.dispatchEvent(new Event("cartUpdated"));
        }
      } catch (e) {
        console.error(e);
      }
    }
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    setUpdatingId(null);
  }

  const selectedItems = items.filter((i) => selectedIds.has(i.id));
  const subtotal = selectedItems.reduce((sum, item) => {
    const itemPrice = item.product.price + (item.variant?.price_adjustment ?? 0);
    return sum + itemPrice * item.quantity;
  }, 0);

  function handleCheckout() {
    if (noneSelected) return;

    if (user) {
      // Send selected database IDs
      const ids = [...selectedIds].join(",");
      router.push(`/checkout?items=${ids}`);
    } else {
      // Guest: Store checked out items specifically in a temporary localstorage key
      // and redirect with type=guest
      const checkedOutItems = selectedItems.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
      }));
      localStorage.setItem("checkout_guest_items", JSON.stringify(checkedOutItems));
      router.push(`/checkout?items=guest`);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} style={{ color: "#c0392b", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fdf6f0" }}>
      {/* Navbar */}
      <header style={navStyle.header}>
        <div style={navStyle.inner}>
          <a href="/" style={navStyle.logo}>
            <ChefHat size={22} color="#c0392b" strokeWidth={2.5} />
            <span style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.4px" }}>
              <span style={{ color: "#c0392b" }}>Dimsum</span>
              <span style={{ color: "#2d2a26" }}>Store</span>
            </span>
          </a>
          <NavbarCart />
        </div>
      </header>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShoppingCart size={24} color="#c0392b" />
          Keranjang Belanja
        </h1>

        {items.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6rem 0", textAlign: "center" }}>
            <div style={{ width: 88, height: 88, background: "#fef2f2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
              <PackageOpen size={40} color="#c0392b" />
            </div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.5rem" }}>Keranjang kamu kosong</h2>
            <p style={{ color: "#6b6560", fontSize: "0.875rem", marginBottom: "2rem" }}>Yuk, tambahkan dimsum favorit kamu!</p>
            <Link href="/" style={btn.primary}>Lihat Menu</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
            {/* Items column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {/* Select all bar */}
              <div style={{ background: "#fff", border: "1px solid #f0e8e4", borderRadius: "0.75rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button
                  onClick={toggleAll}
                  style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem", fontWeight: 600, color: "#1a1a1a", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  {allSelected ? (
                    <CheckSquare size={20} color="#c0392b" />
                  ) : (
                    <Square size={20} color="#d4c9c4" />
                  )}
                  {allSelected ? "Batal Pilih Semua" : "Pilih Semua"}
                </button>
                {!noneSelected && (
                  <span style={{ fontSize: "0.75rem", color: "#6b6560", fontWeight: 500 }}>
                    {selectedIds.size} dari {items.length} item dipilih
                  </span>
                )}
              </div>

              {/* Item cards */}
              {items.map((item) => {
                const isUpdating = updatingId === item.id;
                const isSelected = selectedIds.has(item.id);
                const activeStock = item.variant ? item.variant.stock : item.product.stock;
                const maxQty = Math.min(activeStock, 10);
                const activePrice = item.product.price + (item.variant?.price_adjustment ?? 0);

                return (
                  <div
                    key={item.id}
                    style={{
                      background: "#fff",
                      border: `1px solid ${isSelected ? "rgba(192,57,43,0.25)" : "#f0e8e4"}`,
                      borderRadius: "0.75rem",
                      padding: "1rem",
                      display: "flex",
                      gap: "0.75rem",
                      opacity: isUpdating ? 0.5 : isSelected ? 1 : 0.6,
                      transition: "all 0.2s",
                    }}
                  >
                    <button onClick={() => toggleItem(item.id)} style={{ flexShrink: 0, marginTop: 2, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      {isSelected ? (
                        <CheckSquare size={20} color="#c0392b" />
                      ) : (
                        <Square size={20} color="#d4c9c4" />
                      )}
                    </button>

                    <div style={{ position: "relative", width: 80, height: 80, borderRadius: "0.75rem", overflow: "hidden", background: "#fdf6f0", flexShrink: 0 }}>
                      <Image
                        src={getProductImageUrl(item.product.image_url)}
                        alt={item.product.name}
                        fill
                        sizes="80px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                        <div>
                          <h3 style={{ fontWeight: 700, color: "#1a1a1a", fontSize: "0.875rem", lineHeight: 1.4 }}>
                            {item.product.name}
                            {item.variant && (
                              <span style={{ marginLeft: 6, display: "inline-flex", alignItems: "center", padding: "1px 6px", borderRadius: 4, fontSize: "0.7rem", fontWeight: 700, background: "#fef2f2", color: "#c0392b", border: "1px solid rgba(192,57,43,0.2)" }}>
                                {item.variant.name}
                              </span>
                            )}
                          </h3>
                          <span style={{ fontSize: "0.75rem", color: "#6b6560", marginTop: 2, display: "block" }}>
                            {item.product.category}
                          </span>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={isUpdating}
                          style={{ color: "#d4c9c4", background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}
                          aria-label="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", border: "1px solid #f0e8e4", borderRadius: "50px", overflow: "hidden", background: "#fff" }}>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isUpdating}
                            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b6560", background: "none", border: "none", cursor: item.quantity <= 1 ? "not-allowed" : "pointer", opacity: item.quantity <= 1 ? 0.35 : 1 }}
                          >
                            <Minus size={13} />
                          </button>
                          <span style={{ width: 28, textAlign: "center", fontSize: "0.875rem", fontWeight: 700, color: "#1a1a1a" }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= maxQty || isUpdating}
                            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b6560", background: "none", border: "none", cursor: item.quantity >= maxQty ? "not-allowed" : "pointer", opacity: item.quantity >= maxQty ? 0.35 : 1 }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <span style={{ fontWeight: 800, color: "#f5a623", fontSize: "0.9rem" }}>
                          {formatPrice(activePrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#c0392b", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none", marginTop: "0.25rem" }}>
                + Tambah item lain
              </Link>
            </div>

            {/* Order summary */}
            <div>
              <div style={{ background: "#fff", border: "1px solid #f0e8e4", borderRadius: "1rem", padding: "1.5rem", position: "sticky", top: "80px" }}>
                <h2 style={{ fontWeight: 800, color: "#1a1a1a", fontSize: "1.1rem", marginBottom: "1.25rem" }}>Ringkasan Pesanan</h2>
                {noneSelected ? (
                  <p style={{ fontSize: "0.875rem", color: "#6b6560", textAlign: "center", padding: "1rem 0" }}>Pilih minimal 1 item untuk melanjutkan</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
                    <div style={{ fontSize: "0.75rem", color: "#6b6560", marginBottom: 2 }}>{selectedIds.size} item dipilih</div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#6b6560" }}>
                      <span>Subtotal</span>
                      <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{formatPrice(subtotal)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#6b6560" }}>
                      <span>Ongkos Kirim</span>
                      <span style={{ fontWeight: 500, color: "#6b6560", fontSize: "0.75rem", fontStyle: "italic" }}>Akan dihitung saat checkout</span>
                    </div>
                    <div style={{ borderTop: "1px dashed #f0e8e4", margin: "0.25rem 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#1a1a1a", fontWeight: 800, fontSize: "1rem" }}>
                      <span>Total Sementara</span>
                      <span style={{ color: "#f5a623" }}>{formatPrice(subtotal)}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={noneSelected}
                  style={{
                    width: "100%",
                    marginTop: "1.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    fontWeight: 700,
                    padding: "1rem",
                    borderRadius: "50px",
                    border: "none",
                    cursor: noneSelected ? "not-allowed" : "pointer",
                    fontSize: "0.9rem",
                    background: noneSelected ? "#f0e8e4" : "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
                    color: noneSelected ? "#aaa" : "#fff",
                    boxShadow: noneSelected ? "none" : "0 4px 14px rgba(192,57,43,0.35)",
                    transition: "all 0.2s",
                  }}
                >
                  Lanjut ke Pembayaran
                  {!noneSelected && (
                    <span style={{ background: "rgba(255,255,255,0.2)", fontSize: "0.75rem", padding: "2px 8px", borderRadius: 99 }}>{selectedIds.size}</span>
                  )}
                  <ArrowRight size={18} />
                </button>

                <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#6b6560", marginTop: "0.75rem" }}>Pembayaran aman via Midtrans</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <SharedFooter />
    </div>
  );
}

const navStyle: Record<string, React.CSSProperties> = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    backgroundColor: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid #f0e8e4",
    boxShadow: "0 1px 8px rgba(180,60,40,0.06)",
  },
  inner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 1.5rem",
    height: "62px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1.25rem",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    textDecoration: "none",
    flexShrink: 0,
  },
};

const btn: Record<string, React.CSSProperties> = {
  primary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    background: "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.875rem",
    padding: "0.75rem 2rem",
    borderRadius: "50px",
    textDecoration: "none",
    boxShadow: "0 4px 14px rgba(192,57,43,0.35)",
  },
};
