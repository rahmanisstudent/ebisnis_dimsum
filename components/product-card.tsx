import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice, getProductImageUrl } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  rating?: number | null;
  reviewsCount?: number;
}

export default function ProductCard({ product, rating, reviewsCount = 0 }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;
  const imageUrl = getProductImageUrl(product.image_url);

  return (
    <Link href={`/product/${product.id}`} style={card.wrapper(isOutOfStock)}>
      {/* ── Image ── */}
      <div style={card.imageWrap}>
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          style={{ objectFit: "cover", transition: "transform 0.4s ease" }}
          className="product-card-img"
        />

        {/* Rating badge – top right */}
        {rating && (
          <div style={card.ratingBadge}>
            <Star size={10} fill="#f59e0b" color="#f59e0b" />
            <span>{rating}</span>
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div style={card.outOfStockOverlay}>
            <span style={card.outOfStockLabel}>Habis</span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={card.body}>
        {/* Category tag */}
        <span style={card.categoryTag}>{product.category}</span>

        {/* Name */}
        <h3 style={card.name}>{product.name}</h3>

        {/* Description */}
        {product.description && (
          <p style={card.desc}>
            {product.description.length > 60
              ? product.description.slice(0, 60) + "…"
              : product.description}
          </p>
        )}

        {/* Price + Cart button */}
        <div style={card.footer}>
          <span style={card.price}>{formatPrice(product.price)}</span>

          <div
            style={card.cartBtn(isOutOfStock)}
            aria-label="Tambah ke keranjang"
          >
            <ShoppingCart size={15} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Styles ────────────────────────────────────────────────────────────────── */
const card = {
  wrapper: (outOfStock: boolean): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    borderRadius: "16px",
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 2px 12px rgba(45,42,38,0.07)",
    border: "1px solid #f0e8e4",
    textDecoration: "none",
    transition: "box-shadow 0.2s, transform 0.2s",
    opacity: outOfStock ? 0.72 : 1,
    cursor: "pointer",
  }),

  imageWrap: {
    position: "relative" as const,
    width: "100%",
    aspectRatio: "1 / 1" as const,
    background: "#faf6f1",
    overflow: "hidden" as const,
  },

  ratingBadge: {
    position: "absolute" as const,
    top: "0.5rem",
    right: "0.5rem",
    display: "flex",
    alignItems: "center",
    gap: "0.2rem",
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(4px)",
    borderRadius: "50px",
    padding: "0.2rem 0.5rem",
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#2d2a26",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  },

  outOfStockOverlay: {
    position: "absolute" as const,
    inset: 0,
    background: "rgba(0,0,0,0.38)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  outOfStockLabel: {
    background: "#fff",
    color: "#2d2a26",
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "0.3rem 0.875rem",
    borderRadius: "50px",
  },

  body: {
    display: "flex" as const,
    flexDirection: "column" as const,
    padding: "0.875rem",
    gap: "0.3rem",
    flex: 1,
  },

  categoryTag: {
    fontSize: "0.68rem",
    fontWeight: 600,
    color: "#c0392b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.4px",
  },

  name: {
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "#1a1a1a",
    lineHeight: 1.3,
    margin: 0,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  } as React.CSSProperties,

  desc: {
    fontSize: "0.72rem",
    color: "#999",
    lineHeight: 1.5,
    margin: 0,
  },

  footer: {
    display: "flex" as const,
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: "0.625rem",
    borderTop: "1px solid #f0e8e4",
  },

  price: {
    fontSize: "0.95rem",
    fontWeight: 800,
    color: "#c0392b",
  },

  cartBtn: (outOfStock: boolean): React.CSSProperties => ({
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: outOfStock ? "#e8e4e0" : "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
    color: outOfStock ? "#b0aaa4" : "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: outOfStock ? "none" : "0 2px 8px rgba(192,57,43,0.28)",
    transition: "transform 0.15s, box-shadow 0.15s",
  }),
};
