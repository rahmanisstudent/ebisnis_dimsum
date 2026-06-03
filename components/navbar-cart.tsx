"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ShoppingCart, LogOut, User as UserIcon, LogIn, ChevronDown, ClipboardList, Settings, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function NavbarCart() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  // Listen for clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch user role from users table
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        setIsAdmin(profile?.role === "admin");

        // Fetch cart item count
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
        setIsAdmin(false);
      } else {
        // Fetch cart again on sign in
        init();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Sync guest cart count if guest checkout is running
  useEffect(() => {
    if (!user && !loading) {
      const updateGuestCartCount = () => {
        try {
          const guestCart = JSON.parse(localStorage.getItem("guest_cart") ?? "[]");
          const count = guestCart.reduce((acc: number, item: any) => acc + item.quantity, 0);
          setCartCount(count);
        } catch (e) {
          setCartCount(0);
        }
      };

      updateGuestCartCount();
      // Listen for localstorage changes
      window.addEventListener("storage", updateGuestCartCount);
      // Custom event for same-window updates
      window.addEventListener("cartUpdated", updateGuestCartCount);
      return () => {
        window.removeEventListener("storage", updateGuestCartCount);
        window.removeEventListener("cartUpdated", updateGuestCartCount);
      };
    }
  }, [user, loading]);

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem("guest_cart"); // clear guest cart on logout just in case
    setDropdownOpen(false);
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return <div className="w-24 h-8 animate-pulse rounded-lg bg-gray-100" />;
  }

  return (
    <div className="flex items-center gap-4">
      {/* Main static links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted mr-2">
        <Link href="/" className="hover:text-primary transition-colors duration-200">
          Menu
        </Link>
        <Link href="/orders/track" className="hover:text-primary transition-colors duration-200">
          Lacak Pesanan
        </Link>
      </nav>

      {/* Cart Link — only for authenticated users */}
      {user && (
        <Link
          href="/cart"
          className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-text-muted hover:text-primary hover:bg-primary-light/10 transition-all duration-200"
          aria-label="Keranjang Belanja"
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-scale-in">
              {cartCount}
            </span>
          )}
        </Link>
      )}

      {/* Auth Control */}
      {!user ? (
        <Link
          href="/login"
          className="flex items-center gap-2 text-sm font-bold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all duration-200"
        >
          <LogIn size={16} />
          Masuk
        </Link>
      ) : (
        /* Account Dropdown */
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 text-sm font-medium text-text-main"
          >
            <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <UserIcon size={14} />
            </div>
            <span className="hidden sm:inline truncate max-w-[80px]">
              {user.email?.split("@")[0]}
            </span>
            <ChevronDown size={14} className={cn("text-text-muted transition-transform duration-200", dropdownOpen && "rotate-180")} />
          </button>

          {/* Floating Dropdown Card */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100/80 py-2 z-50 animate-scale-in">
              <div className="px-4 py-2 border-b border-gray-100 mb-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted/60">Masuk sebagai</p>
                <p className="text-xs font-semibold text-text-main truncate mt-0.5" title={user.email}>
                  {user.email}
                </p>
              </div>

              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-muted hover:text-primary hover:bg-primary-light/10 transition-colors"
              >
                <UserIcon size={16} />
                Profil Saya
              </Link>

              <Link
                href="/orders"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-muted hover:text-primary hover:bg-primary-light/10 transition-colors"
              >
                <ClipboardList size={16} />
                Riwayat Pesanan
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors border-t border-gray-50 mt-1 font-semibold"
                >
                  <Settings size={16} />
                  Panel Admin
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-50 mt-1 text-left font-medium"
              >
                <LogOut size={16} />
                Keluar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
