import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product-card";
import { ProductSkeletonGrid } from "@/components/product-skeleton";
import CategoryFilter from "@/components/category-filter";
import ProductSearch from "@/components/product-search";
import NavbarCart from "@/components/navbar-cart";
import type { Product, Category } from "@/types";
import { ArrowRight } from "lucide-react";

// ─── Product Grid ─────────────────────────────────────────────────────────────
async function ProductGrid({ category, search }: { category: string; search: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data: products, error } = await query;

  if (error) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <ChefHat className="text-red-400" size={28} />
        </div>
        <p className="text-text-muted font-medium">Gagal memuat produk</p>
        <p className="text-text-muted/60 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  const productList = products as Product[];

  if (!productList || productList.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">🥟</div>
        <p className="text-text-main font-semibold text-lg">Belum ada produk di kategori ini.</p>
        <p className="text-text-muted text-sm mt-1">Coba pilih kategori lain.</p>
      </div>
    );
  }

  const { data: reviews } = await supabase.from("reviews").select("product_id, rating");

  const ratingMap: Record<string, { avg: number; count: number }> = {};
  if (reviews) {
    reviews.forEach((r) => {
      if (!ratingMap[r.product_id]) ratingMap[r.product_id] = { sum: 0, count: 0 } as any;
      const entry = ratingMap[r.product_id] as any;
      entry.sum += r.rating;
      entry.count += 1;
    });
    Object.keys(ratingMap).forEach((prodId) => {
      const entry = ratingMap[prodId] as any;
      ratingMap[prodId] = { avg: parseFloat((entry.sum / entry.count).toFixed(1)), count: entry.count };
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
    <div className="min-h-screen" style={{ background: "#fdf6f0", fontFamily: "var(--font-sans)" }}>

      {/* ─── Navbar ───────────────────────────────────────────────────────────── */}
      <header style={navStyles.header}>
        <div style={navStyles.inner}>
          {/* Logo */}
          <a href="/" style={navStyles.logo}>
            <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>🥟</span>
            <span style={navStyles.logoText}>
              <span style={{ color: "#c0392b" }}>Dimsum</span>
              <span style={{ color: "#2d2a26" }}>Store</span>
            </span>
          </a>

          {/* Search bar – center */}
          <Suspense fallback={<div style={navStyles.searchSkeleton} />}>
            <div style={navStyles.searchWrap}>
              <ProductSearch />
            </div>
          </Suspense>

          {/* Right actions */}
          <NavbarCart />
        </div>
      </header>

      {/* ─── Hero Banner ──────────────────────────────────────────────────────── */}
      <section style={heroStyles.section}>
        {/* Background image */}
        <div style={heroStyles.imageBg} />
        {/* Dark overlay */}
        <div style={heroStyles.overlay} />

        <div style={heroStyles.content}>
          <h1 style={heroStyles.title}>
            Authentic Dimsum,<br />
            <span style={{ color: "#f5a623" }}>Delivered Fresh.</span>
          </h1>

          <p style={heroStyles.subtitle}>
            Experience the warmth of traditional dimsum dining with our
            carefully crafted, steaming hot selections.
          </p>

          <a href="#catalog" style={heroStyles.cta}>
            Order Now <ArrowRight size={17} />
          </a>
        </div>
      </section>

      {/* ─── Catalog ──────────────────────────────────────────────────────────── */}
      <section id="catalog" style={{ maxWidth: "1280px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        {/* Header row */}
        <div style={catalogStyles.headerRow}>
          <div>
            <h2 style={catalogStyles.heading}>Menu Populer</h2>
            <p style={catalogStyles.sub}>Pilihan favorit dari dapur kami</p>
          </div>
        </div>

        {/* Category filter pills */}
        <div style={{ marginBottom: "1.75rem" }}>
          <Suspense fallback={<div style={{ height: "2.5rem" }} />}>
            <CategoryFilter categories={categories} />
          </Suspense>
        </div>

        {/* Product grid */}
        <Suspense
          key={activeCategory + "_" + searchQuery}
          fallback={<ProductSkeletonGrid count={8} />}
        >
          <ProductGrid category={activeCategory} search={searchQuery} />
        </Suspense>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={footerStyles.footer}>
        <div style={footerStyles.inner}>
          <div style={footerStyles.top}>
            {/* Brand */}
            <div style={footerStyles.brand}>
              <span style={{ fontSize: "1.5rem" }}>🥟</span>
              <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                <span style={{ color: "#fff" }}>Dimsum</span>
                <span style={{ color: "#f5a623" }}>Store</span>
              </span>
            </div>

            {/* Links */}
            <div style={footerStyles.links}>
              {[
                { href: "/", label: "Menu" },
                { href: "/cart", label: "Keranjang" },
                { href: "/orders", label: "Pesanan" },
                { href: "/orders/track", label: "Lacak Pesanan" },
                { href: "/privacy-policy", label: "Kebijakan Privasi" },
              ].map(({ href, label }) => (
                <a key={href} href={href} style={footerStyles.link}>{label}</a>
              ))}
            </div>
          </div>

          <div style={footerStyles.divider} />
          <p style={footerStyles.copy}>
            © {new Date().getFullYear()} DimsumStore. Semua hak dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── Style objects ─────────────────────────────────────────────────────────── */

const navStyles = {
  header: {
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
    backgroundColor: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid #f0e8e4",
    boxShadow: "0 1px 8px rgba(180,60,40,0.06)",
  },
  inner: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "0 1.5rem",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1.5rem",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    textDecoration: "none",
    flexShrink: 0,
  },
  logoText: {
    fontSize: "1.25rem",
    fontWeight: 800,
    letterSpacing: "-0.4px",
  },
  searchWrap: {
    flex: 1,
    maxWidth: "440px",
  },
  searchSkeleton: {
    flex: 1,
    maxWidth: "440px",
    height: "42px",
    borderRadius: "50px",
    background: "#f0e8e4",
  },
};

const heroStyles = {
  section: {
    position: "relative" as const,
    height: "260px",
    overflow: "hidden" as const,
    margin: "1.5rem",
    borderRadius: "20px",
  },
  imageBg: {
    position: "absolute" as const,
    inset: 0,
    backgroundImage: "url('/hero-banner.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    transform: "scale(1.02)",
  },
  overlay: {
    position: "absolute" as const,
    inset: 0,
    background:
      "linear-gradient(90deg, rgba(10,4,2,0.82) 0%, rgba(10,4,2,0.65) 50%, rgba(10,4,2,0.35) 100%)",
  },
  content: {
    position: "relative" as const,
    zIndex: 1,
    padding: "3rem 3.5rem",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    maxWidth: "560px",
    gap: "0.875rem",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(8px)",
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.375rem 0.875rem",
    borderRadius: "50px",
    width: "fit-content",
    letterSpacing: "0.3px",
  },
  title: {
    fontSize: "clamp(1.6rem, 3vw, 2.25rem)",
    fontWeight: 800,
    color: "#fff",
    lineHeight: 1.25,
    margin: 0,
  },
  subtitle: {
    fontSize: "0.875rem",
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.7,
    margin: 0,
  },
  cta: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.95rem",
    padding: "0.75rem 1.625rem",
    borderRadius: "50px",
    textDecoration: "none",
    width: "fit-content",
    boxShadow: "0 4px 16px rgba(192,57,43,0.4)",
    marginTop: "0.25rem",
  },
  stats: {
    display: "flex",
    gap: "1.5rem",
    marginTop: "0.5rem",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
  },
  statIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  statValue: {
    fontSize: "1rem",
    fontWeight: 800,
    color: "#fff",
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: "0.7rem",
    color: "rgba(255,255,255,0.6)",
    lineHeight: 1,
  },
};

const catalogStyles = {
  headerRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: "1.25rem",
  } as React.CSSProperties,
  heading: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#1a1a1a",
    marginBottom: "0.2rem",
  } as React.CSSProperties,
  sub: {
    fontSize: "0.82rem",
    color: "#c0392b",
    fontWeight: 500,
  } as React.CSSProperties,
};

const footerStyles = {
  footer: {
    background: "#1e1210",
    marginTop: "4rem",
  },
  inner: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "3rem 1.5rem 2rem",
  },
  top: {
    display: "flex",
    flexWrap: "wrap" as const,
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1.5rem",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  links: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.5rem 1.5rem",
  },
  link: {
    fontSize: "0.875rem",
    color: "rgba(255,255,255,0.5)",
    textDecoration: "none",
    transition: "color 0.2s",
  },
  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.08)",
    margin: "2rem 0 1.25rem",
  },
  copy: {
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.3)",
    textAlign: "center" as const,
  },
};
