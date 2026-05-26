"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, LogOut, User as UserIcon, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/**
 * S04: Combined Navbar component that shows cart badge + auth state.
 * Replaces separate navbar-cart and integrates navbar-auth.
 */
export default function NavbarCart() {
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: cart } = await supabase
          .from("carts")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (cart) {
          const { count } = await supabase
            .from("cart_items")
            .select("*", { count: "exact", head: true })
            .eq("cart_id", cart.id);
          setCartCount(count ?? 0);
        }
      }
      setLoading(false);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setCartCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return <div className="w-24 h-8 animate-pulse rounded-lg bg-border-soft" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary transition-colors duration-200"
      >
        <LogIn size={16} />
        Masuk
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* User info (desktop) */}
      <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-text-muted">
        <UserIcon size={14} className="text-primary/60" />
        <span className="truncate max-w-[100px]">{user.email?.split("@")[0]}</span>
      </div>

      {/* Cart link */}
      <Link
        href="/cart"
        className="relative flex items-center gap-1.5 text-text-muted hover:text-primary transition-colors duration-200 p-1.5"
      >
        <ShoppingCart size={20} />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
            {cartCount > 9 ? "9+" : cartCount}
          </span>
        )}
      </Link>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-text-muted hover:text-red-500 transition-colors duration-200 text-sm font-medium p-1.5"
        title="Keluar"
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Keluar</span>
      </button>
    </div>
  );
}
