import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind CSS classes without conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format an integer price (IDR) to a readable Rupiah string.
 * e.g. 15000 → "Rp 15.000"
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Return the Supabase Storage public URL for a product image.
 * Falls back to a placeholder if image_url is null/empty.
 */
export function getProductImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return "/placeholder-dimsum.jpg";
  }
  // If already a full URL (from Supabase Storage), return as-is
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }
  // Otherwise construct from Supabase storage base URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/products/${imageUrl}`;
}
