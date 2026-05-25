"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";

/**
 * Category filter tabs. Updates the `?category=` URL search param
 * so the Server Component re-fetches with the correct filter.
 */
export default function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeCategory = searchParams.get("category") ?? "";

  function handleSelect(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "") {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-2.5 rounded-2xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.85)', border: '1px solid #EDE8E3' }}>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => handleSelect(cat.value)}
          className={
            activeCategory === cat.value
              ? "category-pill category-pill-active"
              : "category-pill"
          }
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
