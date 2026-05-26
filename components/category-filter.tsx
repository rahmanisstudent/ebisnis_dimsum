"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Category } from "@/types";

interface CategoryFilterProps {
  categories: Category[];
}

export default function CategoryFilter({ categories }: CategoryFilterProps) {
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
      {/* "Semua" filter button */}
      <button
        onClick={() => handleSelect("")}
        className={
          activeCategory === ""
            ? "category-pill category-pill-active"
            : "category-pill"
        }
      >
        🥟 Semua
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleSelect(cat.name)}
          className={
            activeCategory === cat.name
              ? "category-pill category-pill-active"
              : "category-pill"
          }
        >
          {cat.emoji ? `${cat.emoji} ${cat.name}` : cat.name}
        </button>
      ))}
    </div>
  );
}
