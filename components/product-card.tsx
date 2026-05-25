import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Package } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice, getProductImageUrl } from "@/lib/utils";
import SpicyIndicator from "./spicy-indicator";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;
  const imageUrl = getProductImageUrl(product.image_url);

  return (
    <Link
      href={`/product/${product.id}`}
      className={cn(
        "group premium-card flex flex-col overflow-hidden",
        isOutOfStock && "opacity-70"
      )}
    >
      {/* ─── Product Image ─────────────────────────────── */}
      <div className="relative w-full aspect-square overflow-hidden" style={{ backgroundColor: '#faf6f1' }}>
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Category badge */}
        <span className="absolute top-3 left-3 backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: '#4A7C59' }}>
          {product.category}
        </span>

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-sm font-bold px-4 py-2 rounded-full" style={{ color: '#2D2A26' }}>
              Habis
            </span>
          </div>
        )}
      </div>

      {/* ─── Product Info ──────────────────────────────── */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 transition-colors duration-200" style={{ color: '#2D2A26' }}>
          {product.name}
        </h3>

        {/* Spicy level */}
        <SpicyIndicator level={product.spicy_level} />

        {/* Stock indicator */}
        <div className="flex items-center gap-1.5 text-xs mt-auto" style={{ color: '#8A857E' }}>
          <Package size={12} />
          <span>{isOutOfStock ? "Stok habis" : `${product.stock} tersedia`}</span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-2 pt-3" style={{ borderTop: '1px solid #EDE8E3' }}>
          <span className="font-bold text-base" style={{ color: '#E8773A' }}>
            {formatPrice(product.price)}
          </span>

          <div
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300",
              isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "group-hover:text-white"
            )}
            style={!isOutOfStock ? { backgroundColor: '#E8F0E4', color: '#4A7C59' } : undefined}
            aria-label="Tambah ke keranjang"
          >
            <ShoppingCart size={16} />
          </div>
        </div>
      </div>
    </Link>
  );
}
