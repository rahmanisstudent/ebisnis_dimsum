import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, ChefHat, FolderHeart, Ticket, BarChart3 } from "lucide-react";
import type { ReactNode } from "react";
import AdminLogoutButton from "@/components/admin/logout-button";

export const metadata = {
  title: {
    default: "Admin — DimsumStore",
    template: "%s | Admin DimsumStore",
  },
};

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/categories", label: "Kategori", icon: FolderHeart },
  { href: "/admin/orders", label: "Pesanan", icon: ShoppingBag },
  { href: "/admin/vouchers", label: "Voucher", icon: Ticket },
  { href: "/admin/reports", label: "Laporan", icon: BarChart3 },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify admin role
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* ─── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col hidden md:flex">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
              <ChefHat size={18} className="text-white" />
            </div>
            <div>
              <p className="font-extrabold text-white text-sm leading-tight">DimsumStore</p>
              <p className="text-gray-500 text-xs">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all text-sm font-medium group"
            >
              <Icon size={17} className="group-hover:text-emerald-400 transition-colors" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="w-7 h-7 bg-emerald-600/20 rounded-full flex items-center justify-center">
              <span className="text-emerald-400 text-xs font-bold">
                {user.email?.[0]?.toUpperCase() ?? "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.email}</p>
              <p className="text-gray-500 text-xs">Admin</p>
            </div>
          </div>
          <AdminLogoutButton />
        </div>
      </aside>

      {/* ─── Main content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden bg-gray-900 border-b border-gray-800 px-4 h-14 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <ChefHat size={20} className="text-emerald-500" />
            <span className="font-extrabold text-white text-sm">Admin</span>
          </Link>
          <div className="flex gap-1 items-center">
            {navItems.map(({ href, icon: Icon }) => (
              <Link key={href} href={href} className="text-gray-400 hover:text-white p-2">
                <Icon size={18} />
              </Link>
            ))}
            <div className="w-px h-5 bg-gray-700 mx-1" />
            <AdminLogoutButton />
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-950 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
