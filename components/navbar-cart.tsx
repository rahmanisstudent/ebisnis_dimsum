"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import NavbarAuth from "@/components/navbar-auth";
import { createClient } from "@/lib/supabase/client";

/**
 * Client Component — works in both Server and Client Component trees.
 * Fetches cart count using the browser Supabase client (no next/headers).
 * Updates automatically after router.refresh().
 */
export default function NavbarCart() {
  const [cartCount, setCartCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function fetchCount() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (isMounted) setCartCount(0);
        return;
      }

      const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!cart) {
        if (isMounted) setCartCount(0);
        return;
      }

      const { data: items } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("cart_id", cart.id);

      const total =
        items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0;

      if (isMounted) setCartCount(total);
    }

    fetchCount();

    // Re-fetch whenever auth state changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchCount();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <div className="flex items-center gap-4">
      <NavbarAuth />

      <Link
        href="/cart"
        className="btn-primary relative flex items-center gap-2 text-sm !py-2.5 !px-5 !rounded-2xl"
      >
        <ShoppingBag size={16} />
        <span className="hidden sm:inline">Keranjang</span>

        {cartCount > 0 && (
          <span
            className="absolute -top-2 -right-2 min-w-[22px] h-[22px] text-white text-[10px] font-black rounded-full flex items-center justify-center px-1"
            style={{ backgroundColor: '#E8773A', boxShadow: '0 2px 6px rgba(232,119,58,0.4)' }}
          >
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </Link>
    </div>
  );
}
