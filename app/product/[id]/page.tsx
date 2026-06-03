import { createClient } from "@/lib/supabase/server";
import { formatPrice, getProductImageUrl, cn } from "@/lib/utils";
import type { Product } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package, Tag, ChefHat, Star, MessageSquare } from "lucide-react";
import SpicyIndicator from "@/components/spicy-indicator";
import AddToCartButton from "@/components/add-to-cart-button";
import NavbarCart from "@/components/navbar-cart";
import ReviewForm from "@/components/review-form";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, description")
    .eq("id", id)
    .single();

  if (!product) return { title: "Produk Tidak Ditemukan" };

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) notFound();

  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("*, user:user_profiles(full_name)")
    .eq("product_id", id)
    .order("created_at", { ascending: false });

  const reviews = (reviewsData as any[]) ?? [];
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  // ── Review eligibility checks (server-side) ────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  let canReview = false;
  let alreadyReviewed = false;

  if (user) {
    // 1. Find completed orders by this user
    const { data: completedOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "selesai");

    if (completedOrders && completedOrders.length > 0) {
      const orderIds = completedOrders.map((o: any) => o.id);

      // 2. Check if any of those orders contain this product
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("order_id")
        .in("order_id", orderIds)
        .eq("product_id", id)
        .limit(1);

      if (orderItems && orderItems.length > 0) {
        // 3. Check for existing review (duplicate guard)
        const { data: existingReview } = await supabase
          .from("reviews")
          .select("id")
          .eq("user_id", user.id)
          .eq("product_id", id)
          .maybeSingle();

        alreadyReviewed = !!existingReview;
        canReview = !alreadyReviewed;
      }
    }
  }

  const p = product as Product;
  const imageUrl = getProductImageUrl(p.image_url);
  const isOutOfStock = p.stock === 0;

  return (
    <div className="min-h-screen">
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <span className="text-2xl">🥟</span>
            <span className="font-extrabold text-xl tracking-tight">
              <span className="text-primary">DimSum</span><span className="text-accent">Store</span>
            </span>
          </a>
          <NavbarCart />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors duration-200 font-medium">
          <ArrowLeft size={16} />
          Kembali ke Menu
        </Link>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-sm border border-border-soft overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative aspect-square bg-cream overflow-hidden">
              <Image src={imageUrl} alt={p.name} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
              <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                <Tag size={11} />{p.category}
              </span>
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="bg-white rounded-2xl px-6 py-3 text-center">
                    <p className="font-bold text-text-main text-lg">Stok Habis</p>
                    <p className="text-text-muted text-sm">Sedang tidak tersedia</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col p-6 md:p-10 gap-5">
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-main leading-tight">{p.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-muted font-medium">Pedas:</span>
                  <SpicyIndicator level={p.spicy_level} />
                </div>
                {avgRating && (
                  <div className="flex items-center gap-1.5 text-amber-500 border-l border-border-soft pl-4">
                    <Star size={15} fill="currentColor" />
                    <span className="text-sm font-bold text-text-main">{avgRating}</span>
                    <span className="text-xs text-text-muted">({reviews.length} ulasan)</span>
                  </div>
                )}
              </div>
              <p className="text-text-muted leading-relaxed text-sm md:text-base">{p.description || "Tidak ada deskripsi produk."}</p>
              <div className={cn("flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-2xl w-fit", isOutOfStock ? "bg-red-50 text-red-600" : "bg-primary-light text-primary")}>
                <Package size={15} />{isOutOfStock ? "Stok habis" : `${p.stock} unit tersedia`}
              </div>
              <div className="border-t border-border-soft" />
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-1">Harga</p>
                <p className="text-3xl md:text-4xl font-extrabold text-accent">{formatPrice(p.price)}</p>
              </div>
              <AddToCartButton product={p} />
              <div className="flex items-start gap-3 bg-primary-light/50 rounded-2xl p-4 mt-auto">
                <ChefHat className="text-primary shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-primary-dark leading-relaxed">Dibuat segar setiap hari dari bahan-bahan pilihan berkualitas tinggi. Dinikmati paling enak saat hangat!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-8 bg-white rounded-3xl p-6 md:p-8 border border-border-soft">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-border-soft">
            <MessageSquare className="text-primary" size={20} />
            <h2 className="text-lg font-black text-text-main">Ulasan Pelanggan ({reviews.length})</h2>
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">Belum ada ulasan untuk produk ini.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {reviews.map((r) => (
                <div key={r.id} className="flex flex-col gap-2 pb-5 border-b border-border-soft/60 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-sm text-text-main">
                        {r.user?.full_name || "Pelanggan"}
                      </p>
                      <div className="flex items-center gap-0.5 text-amber-400 mt-0.5">
                        {[...Array(5)].map((_, idx) => (
                          <Star
                            key={idx}
                            size={12}
                            fill={idx < r.rating ? "currentColor" : "none"}
                            className={idx < r.rating ? "" : "text-gray-200"}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-text-muted font-medium">
                      {new Date(r.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-xs text-text-main leading-relaxed mt-1 font-medium bg-cream/20 px-3 py-2 rounded-xl border border-border-soft/40 italic">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Review submission form — visibility controlled by ReviewForm itself */}
          <div className="mt-6 pt-6 border-t border-border-soft">
            <ReviewForm
              productId={id}
              isLoggedIn={isLoggedIn}
              canReview={canReview}
              alreadyReviewed={alreadyReviewed}
            />
          </div>
        </div>
      </main>

      <footer className="bg-warm-dark text-white/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🥟</span>
              <span className="font-extrabold text-white">DimSum<span className="text-accent">Store</span></span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <a href="/" className="hover:text-white transition-colors duration-200">
                Menu
              </a>
              <a href="/cart" className="hover:text-white transition-colors duration-200">
                Keranjang
              </a>
              <a href="/orders" className="hover:text-white transition-colors duration-200">
                Pesanan
              </a>
              <a href="/orders/track" className="hover:text-white transition-colors duration-200">
                Lacak Pesanan
              </a>
              <a href="/privacy-policy" className="hover:text-white transition-colors duration-200 font-medium text-accent">
                Kebijakan Privasi
              </a>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 text-center">
            <p className="text-sm">© {new Date().getFullYear()} DimsumStore. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
