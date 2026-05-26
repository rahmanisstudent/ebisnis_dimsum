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

import { STORE_LOCATION, SHIPPING_RATE_PER_KM, SHIPPING_MIN_COST, SHIPPING_MAX_COST } from "./constants";

const YOGYA_DISTRICT_DISTANCES: Record<string, number> = {
  "danurejan": 1.5,
  "gedongtengen": 1.0,
  "gondokusuman": 2.5,
  "gondomanan": 1.2,
  "jetis": 2.0,
  "kotagede": 5.0,
  "kraton": 2.0,
  "mantrijeron": 3.5,
  "mergangsan": 3.0,
  "ngampilan": 1.5,
  "pakualaman": 2.0,
  "tegalrejo": 3.0,
  "umbulharjo": 4.5,
  "wirobrajan": 2.5,
  "depok": 6.0,
  "mlati": 7.0,
  "gamping": 6.5,
  "sleman": 12.0,
  "ngaglik": 10.0,
  "kalasan": 11.0,
  "berbah": 9.0,
  "godean": 9.5,
  "kasihan": 6.0,
  "sewon": 7.0,
  "banguntapan": 6.0,
  "bantul": 12.0,
  "piyungan": 13.0,
  "jetis bantul": 14.0,
  "pundong": 18.0,
};

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateShippingCost(
  subDistrict?: string | null,
  district?: string | null,
  lat?: number | null,
  lng?: number | null
): { distance: number; cost: number } {
  let distance = 5.0; // Default

  if (lat != null && lng != null) {
    distance = calculateDistance(lat, lng, STORE_LOCATION.latitude, STORE_LOCATION.longitude);
  } else {
    const subClean = subDistrict?.toLowerCase().trim() ?? "";
    const distClean = district?.toLowerCase().trim() ?? "";

    if (YOGYA_DISTRICT_DISTANCES[subClean]) {
      distance = YOGYA_DISTRICT_DISTANCES[subClean];
    } else if (YOGYA_DISTRICT_DISTANCES[distClean]) {
      distance = YOGYA_DISTRICT_DISTANCES[distClean];
    } else {
      distance = 6.0;
    }
  }

  const calculatedCost = Math.round(distance * SHIPPING_RATE_PER_KM);
  const cost = Math.max(SHIPPING_MIN_COST, Math.min(SHIPPING_MAX_COST, calculatedCost));
  return { distance: Math.round(distance * 10) / 10, cost };
}
