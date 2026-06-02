import React, { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product-card";
import { ProductSkeletonGrid } from "@/components/product-skeleton";
import CategoryFilter from "@/components/category-filter";
import ProductSearch from "@/components/product-search";
import NavbarCart from "@/components/navbar-cart";
import type { Product, Category } from "@/types";
import { ArrowRight, ChefHat, Tag } from "lucide-react";

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
      <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 0", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, background: "#fef2f2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
          <ChefHat size={24} color="#f87171" />
        </div>
        <p style={{ color: "#6b6560", fontWeight: 600 }}>Gagal memuat produk.</p>
        <p style={{ color: "#aaa", fontSize: "0.85rem", marginTop: "0.25rem" }}>{error.message}</p>
      </div>
    );
  }

  const productList = products as Product[];

  if (!productList || productList.length === 0) {
    return (
      <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 0", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🥟</div>
        <p style={{ fontWeight: 700, color: "#1a1a1a" }}>Belum ada produk di kategori ini.</p>
        <p style={{ color: "#aaa", fontSize: "0.875rem", marginTop: "0.25rem" }}>Coba pilih kategori lain.</p>
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
    Object.keys(ratingMap).forEach((id) => {
      const e = ratingMap[id] as any;
      ratingMap[id] = { avg: parseFloat((e.sum / e.count).toFixed(1)), count: e.count };
    });
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.25rem" }}>
      {productList.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          rating={ratingMap[p.id]?.avg ?? null}
          reviewsCount={ratingMap[p.id]?.count ?? 0}
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
    <div style={{ minHeight: "100vh", background: "#fdf6f0", fontFamily: "var(--font-sans)" }}>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header style={s.navHeader}>
        <div style={s.navInner}>
          <a href="/" style={s.logo}>
            <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>🥟</span>
            <span style={{ fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.4px" }}>
              <span style={{ color: "#c0392b" }}>Dimsum</span>
              <span style={{ color: "#2d2a26" }}>Store</span>
            </span>
          </a>

          <Suspense fallback={<div style={s.searchSkeleton} />}>
            <div style={s.searchWrap}><ProductSearch /></div>
          </Suspense>

          <NavbarCart />
        </div>
      </header>

      <div style={s.pageContent}>

        {/* ── Hero Banner (contained) ──────────────────────────────────────── */}
        <section style={s.heroBanner}>
          <div style={s.heroBg} />
          <div style={s.heroOverlay} />
          <div style={s.heroBody}>
            <h1 style={s.heroTitle}>
              Authentic Dimsum,<br />
              <span style={{ color: "#f5a623" }}>Delivered Fresh.</span>
            </h1>
            <p style={s.heroSub}>
              Experience the warmth of traditional dimsum dining with our carefully crafted, steaming hot selections.
            </p>
            <a href="#catalog" style={s.heroCta}>
              Order Now <ArrowRight size={16} />
            </a>
          </div>
        </section>

        {/* ── Menu Populer ────────────────────────────────────────────────── */}
        <section id="catalog" style={s.catalogSection}>
          {/* Heading */}
          <div style={s.catalogHead}>
            <h2 style={s.catalogTitle}>Menu Populer</h2>
            <p style={s.catalogSub}>Pilihan favorit dari dapur kami</p>
          </div>

          {/* Category pills – centered */}
          <div style={s.pillsRow}>
            <Suspense fallback={<div style={{ height: "2.25rem" }} />}>
              <CategoryFilter categories={categories} />
            </Suspense>
          </div>

          {/* Product grid */}
          <Suspense key={activeCategory + "_" + searchQuery} fallback={<ProductSkeletonGrid count={8} />}>
            <ProductGrid category={activeCategory} search={searchQuery} />
          </Suspense>
        </section>

        {/* ── Promo Banner ────────────────────────────────────────────────── */}
        <section style={s.promoSection}>
          <div style={s.promoBanner}>
            {/* Glow blobs */}
            <div style={s.promoBlob1} />
            <div style={s.promoBlob2} />

            <div style={s.promoContent}>
              <div style={s.promoContent}>
                <span style={s.promoLabel}>
                  <Tag size={12} />
                  Penawaran Spesial
                </span>
                <h3 style={s.promoTitle}>
                  Dapatkan <span style={{ color: "#1a1a1a" }}>20% diskon</span><br />
                  untuk pesanan pertamamu.
                </h3>
                <p style={s.promoDesc}>
                  Gunakan kode <strong style={{ fontWeight: 800, letterSpacing: "0.5px" }}>DIMSUM20</strong> saat checkout dan rasakan kelezatannya.
                </p>
                <a href="/cart" style={s.promoBtn}>Pesan Sekarang</a>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerTop}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.4rem" }}>🥟</span>
                <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                  <span style={{ color: "#fff" }}>Dimsum</span>
                  <span style={{ color: "#f5a623" }}>Store</span>
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", maxWidth: "200px", lineHeight: 1.6 }}>
                Fresh, hot, and undeniably cute. Premium dimsum experience.
              </p>
            </div>

            {/* Nav links */}
            <div style={s.footerLinks}>
              <p style={s.footerLinkHeading}>Navigasi</p>
              {[
                { href: "/", label: "Menu" },
                { href: "/cart", label: "Keranjang" },
                { href: "/orders", label: "Pesanan" },
                { href: "/orders/track", label: "Lacak Pesanan" },
              ].map(({ href, label }) => (
                <a key={href} href={href} style={s.footerLink}>{label}</a>
              ))}
            </div>

            {/* Legal */}
            <div style={s.footerLinks}>
              <p style={s.footerLinkHeading}>Legal</p>
              <a href="/privacy-policy" style={s.footerLink}>Kebijakan Privasi</a>
            </div>
          </div>

          <div style={s.footerDivider} />
          <p style={s.footerCopy}>
            © {new Date().getFullYear()} DimsumStore. Semua hak dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  /* Navbar */
  navHeader: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    backgroundColor: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid #f0e8e4",
    boxShadow: "0 1px 8px rgba(180,60,40,0.06)",
  },
  navInner: {
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
  searchWrap: { flex: 1, maxWidth: "400px" },
  searchSkeleton: {
    flex: 1,
    maxWidth: "400px",
    height: "40px",
    borderRadius: "50px",
    background: "#f0e8e4",
  },

  /* Page wrapper */
  pageContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "1.5rem 1.5rem 0",
  },

  /* Hero – contained card */
  heroBanner: {
    position: "relative",
    height: "240px",
    borderRadius: "18px",
    overflow: "hidden",
    marginBottom: "2.5rem",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
  },
  heroBg: {
    position: "absolute",
    inset: 0,
    backgroundImage: "url('/hero-banner.png')",
    backgroundSize: "cover",
    backgroundPosition: "center 40%",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(90deg, rgba(8,3,1,0.85) 0%, rgba(8,3,1,0.6) 50%, rgba(8,3,1,0.2) 100%)",
  },
  heroBody: {
    position: "relative",
    zIndex: 1,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "0 2.75rem",
    maxWidth: "520px",
    gap: "0.75rem",
  },
  heroTitle: {
    fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
    fontWeight: 800,
    color: "#fff",
    lineHeight: 1.25,
    margin: 0,
  },
  heroSub: {
    fontSize: "0.82rem",
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.65,
    margin: 0,
  },
  heroCta: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    background: "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.875rem",
    padding: "0.65rem 1.375rem",
    borderRadius: "50px",
    textDecoration: "none",
    width: "fit-content",
    boxShadow: "0 4px 14px rgba(192,57,43,0.4)",
    marginTop: "0.25rem",
  },

  /* Catalog */
  catalogSection: { marginBottom: "3rem" },
  catalogHead: { marginBottom: "1rem" },
  catalogTitle: {
    fontSize: "1.4rem",
    fontWeight: 800,
    color: "#1a1a1a",
    margin: 0,
  },
  catalogSub: {
    fontSize: "0.82rem",
    color: "#c0392b",
    fontWeight: 500,
    marginTop: "0.2rem",
  },
  pillsRow: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "2rem",
    padding: "0.5rem 0",
  },

  /* Promo banner */
  promoSection: { marginBottom: "0" },
  promoBanner: {
    position: "relative",
    borderRadius: "18px",
    overflow: "hidden",
    background: "linear-gradient(135deg, #f9b234 0%, #f5a623 60%, #f8c96b 100%)",
    padding: "2.25rem 2.75rem",
    marginBottom: "0",
  },
  promoBlob1: {
    position: "absolute",
    top: "-40px",
    right: "-40px",
    width: "200px",
    height: "200px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.18)",
  },
  promoBlob2: {
    position: "absolute",
    bottom: "-60px",
    right: "120px",
    width: "160px",
    height: "160px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.12)",
  },
  promoContent: {
    position: "relative",
    zIndex: 1,
    maxWidth: "520px",
    display: "flex",
    flexDirection: "column",
    gap: "0.625rem",
  },
  promoLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "rgba(0,0,0,0.55)",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  promoTitle: {
    fontSize: "clamp(1.3rem, 2vw, 1.7rem)",
    fontWeight: 800,
    color: "#1a1a1a",
    lineHeight: 1.25,
    margin: 0,
  },
  promoDesc: {
    fontSize: "0.82rem",
    color: "rgba(0,0,0,0.55)",
    lineHeight: 1.6,
    margin: 0,
  },
  promoBtn: {
    display: "inline-flex",
    alignItems: "center",
    background: "#1a1a1a",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.875rem",
    padding: "0.65rem 1.5rem",
    borderRadius: "50px",
    textDecoration: "none",
    width: "fit-content",
    marginTop: "0.375rem",
    boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
  },

  /* Footer */
  footer: {
    background: "#1a0f0d",
    marginTop: "4rem",
  },
  footerInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "3rem 1.5rem 2rem",
  },
  footerTop: {
    display: "flex",
    flexWrap: "wrap",
    gap: "3rem",
  },
  footerLinks: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  footerLinkHeading: {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: "1px",
    textTransform: "uppercase",
    marginBottom: "0.25rem",
  },
  footerLink: {
    fontSize: "0.875rem",
    color: "rgba(255,255,255,0.55)",
    textDecoration: "none",
    transition: "color 0.2s",
  },
  footerDivider: {
    height: "1px",
    background: "rgba(255,255,255,0.08)",
    margin: "2.25rem 0 1.25rem",
  },
  footerCopy: {
    fontSize: "0.78rem",
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
  },
};
