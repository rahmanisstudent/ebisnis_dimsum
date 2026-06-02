import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product-card";
import { ProductSkeletonGrid } from "@/components/product-skeleton";
import CategoryFilter from "@/components/category-filter";
import ProductSearch from "@/components/product-search";
import NavbarCart from "@/components/navbar-cart";
import type { Product, Category } from "@/types";
import { ChefHat, Sparkles, Star, Truck } from "lucide-react";

// ─── Product Grid (async Server Component) ────────────────────────────────────
// Separated so it can be wrapped in <Suspense> for streaming skeleton support.

async function ProductGrid({ category, search }: { category: string; search: string }) {
  const supabase = await createClient();

  // Build query — filter by category if provided
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data: products, error } = await query;

  if (error) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <ChefHat className="text-red-400" size={28} />
        </div>
        <p className="text-text-muted font-medium">Gagal memuat produk.</p>
        <p className="text-text-muted/60 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  const productList = products as Product[];

  if (!productList || productList.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">🥟</div>
        <p className="text-text-main font-semibold text-lg">
          Belum ada produk di kategori ini.
        </p>
        <p className="text-text-muted text-sm mt-1">
          Coba pilih kategori lain.
        </p>
      </div>
    );
  }

  // Fetch reviews to calculate average ratings
  const { data: reviews } = await supabase
    .from("reviews")
    .select("product_id, rating");

  const ratingMap: Record<string, { avg: number; count: number }> = {};
  if (reviews) {
    reviews.forEach((r) => {
      if (!ratingMap[r.product_id]) {
        ratingMap[r.product_id] = { sum: 0, count: 0 } as any;
      }
      const entry = ratingMap[r.product_id] as any;
      entry.sum += r.rating;
      entry.count += 1;
    });
    Object.keys(ratingMap).forEach((prodId) => {
      const entry = ratingMap[prodId] as any;
      ratingMap[prodId] = {
        avg: parseFloat((entry.sum / entry.count).toFixed(1)),
        count: entry.count,
      };
    });
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {productList.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          rating={ratingMap[product.id]?.avg ?? null}
          reviewsCount={ratingMap[product.id]?.count ?? 0}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface HomePageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const activeCategory = params.category ?? "";
  const searchQuery = params.search ?? "";

  const supabase = await createClient();
  const { data: categoriesData } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const categories = (categoriesData ?? []) as Category[];

  return (
    <div className="min-h-screen">
      {/* ─── Navbar ─────────────────────────────────────────────────────── */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <span className="text-2xl">🥟</span>
            <span className="font-extrabold text-xl tracking-tight">
              <span className="text-primary">DimSum</span>
              <span className="text-accent">Store</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
            <a
              href="/"
              className="hover:text-primary transition-colors duration-200"
            >
              Menu
            </a>
            <a
              href="/cart"
              className="hover:text-primary transition-colors duration-200"
            >
              Keranjang
            </a>
            <a
              href="/orders"
              className="hover:text-primary transition-colors duration-200"
            >
              Pesanan
            </a>
          </nav>

          <NavbarCart />
        </div>
      </header>

      {/* ─── Hero Banner ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-warm-dark text-white">
        {/* Decorative background blobs */}
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-accent/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-8 w-80 h-80 bg-primary-light/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-white/5 rounded-full blur-2xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 rounded-full mb-5 tracking-wide">
              <Sparkles size={14} />
              Baru & Segar Setiap Hari
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Dimsum Lezat,{" "}
              <span className="text-accent-light">Dikirim ke Rumahmu</span>
            </h1>
            <p className="text-white/80 text-base md:text-lg leading-relaxed">
              Nikmati berbagai pilihan dimsum kukus, goreng, dan frozen
              berkualitas premium. Dibuat segar setiap hari dari bahan pilihan.
            </p>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-8 mt-10">
            {[
              { value: "50+", label: "Menu Pilihan", icon: ChefHat },
              { value: "1000+", label: "Pelanggan Puas", icon: Star },
              { value: "4.9★", label: "Rating", icon: Truck },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Icon size={18} className="text-white/80" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold text-white">
                    {value}
                  </span>
                  <span className="text-white/60 text-xs font-medium">
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Catalog Section ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-text-main mb-1">
              Menu Kami
            </h2>
            <p className="text-text-muted text-sm">Temukan dimsum favorit kamu</p>
          </div>
          <Suspense fallback={<div className="w-full max-w-md h-12 bg-gray-100 animate-pulse rounded-2xl" />}>
            <ProductSearch />
          </Suspense>
        </div>

        {/* Category filter — client component */}
        <div className="mb-8">
          <Suspense fallback={<div className="h-10" />}>
            <CategoryFilter categories={categories} />
          </Suspense>
        </div>

        {/* Product grid — wrapped in Suspense for streaming */}
        <Suspense
          key={activeCategory + "_" + searchQuery} // Re-mount on category or search change
          fallback={<ProductSkeletonGrid count={8} />}
        >
          <ProductGrid category={activeCategory} search={searchQuery} />
        </Suspense>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-warm-dark text-white/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🥟</span>
              <span className="font-extrabold text-lg">
                <span className="text-white">DimSum</span>
                <span className="text-accent">Store</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <a
                href="/"
                className="hover:text-white transition-colors duration-200"
              >
                Menu
              </a>
              <a
                href="/cart"
                className="hover:text-white transition-colors duration-200"
              >
                Keranjang
              </a>
              <a
                href="/orders"
                className="hover:text-white transition-colors duration-200"
              >
                Pesanan
              </a>
              <a
                href="/orders/track"
                className="hover:text-white transition-colors duration-200"
              >
                Lacak Pesanan
              </a>
              <a
                href="/privacy-policy"
                className="hover:text-white transition-colors duration-200 font-medium text-accent"
              >
                Kebijakan Privasi
              </a>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 text-center">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} DimsumStore. Semua hak dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
