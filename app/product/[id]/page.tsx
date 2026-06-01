import { createClient } from "@/lib/supabase/server";
import { formatPrice, getProductImageUrl, cn } from "@/lib/utils";
import type { Product } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package, Tag, ChefHat } from "lucide-react";
import SpicyIndicator from "@/components/spicy-indicator";
import AddToCartButton from "@/components/add-to-cart-button";
import NavbarCart from "@/components/navbar-cart";

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

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) notFound();

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
              <span className="text-primary">DimSum</span>
              <span className="text-accent">Store</span>
            </span>
          </a>
          <NavbarCart />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors duration-200 font-medium"
        >
          <ArrowLeft size={16} />
          Kembali ke Menu
        </Link>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-sm border border-border-soft overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative aspect-square bg-cream overflow-hidden">
              <Image
                src={imageUrl}
                alt={p.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                <Tag size={11} />
                {p.category}
              </span>
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="bg-white rounded-2xl px-6 py-3 text-center">
                    <p className="font-bold text-text-main text-lg">
                      Stok Habis
                    </p>
                    <p className="text-text-muted text-sm">
                      Sedang tidak tersedia
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col p-6 md:p-10 gap-5">
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-main leading-tight">
                {p.name}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted font-medium">
                  Tingkat Pedas:
                </span>
                <SpicyIndicator level={p.spicy_level} />
              </div>
              <p className="text-text-muted leading-relaxed text-sm md:text-base">
                {p.description || "Tidak ada deskripsi produk."}
              </p>
              <div
                className={cn(
                  "flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-2xl w-fit",
                  isOutOfStock
                    ? "bg-red-50 text-red-600"
                    : "bg-primary-light text-primary",
                )}
              >
                <Package size={15} />
                {isOutOfStock ? "Stok habis" : `${p.stock} unit tersedia`}
              </div>
              <div className="border-t border-border-soft" />
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-1">
                  Harga
                </p>
                <p className="text-3xl md:text-4xl font-extrabold text-accent">
                  {formatPrice(p.price)}
                </p>
              </div>
              <AddToCartButton product={p} />
              <div className="flex items-start gap-3 bg-primary-light/50 rounded-2xl p-4 mt-auto">
                <ChefHat className="text-primary shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-primary-dark leading-relaxed">
                  Dibuat segar setiap hari dari bahan-bahan pilihan berkualitas
                  tinggi. Dinikmati paling enak saat hangat!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-warm-dark text-white/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥟</span>
            <span className="font-extrabold text-white">
              DimSum<span className="text-accent">Store</span>
            </span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} DimsumStore. Semua hak dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}
