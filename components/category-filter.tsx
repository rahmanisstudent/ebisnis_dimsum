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

  const allItems = [
    { label: "Semua", value: "" },
    ...categories.map((cat) => ({ label: cat.name, value: cat.name })),
  ];

  return (
    <div style={styles.wrap}>
      {allItems.map(({ label, value }) => {
        const isActive = activeCategory === value;
        return (
          <button
            key={value || "all"}
            onClick={() => handleSelect(value)}
            style={isActive ? styles.pillActive : styles.pill}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  wrap: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.5rem",
    justifyContent: "center",
  },
  pill: {
    padding: "0.45rem 1rem",
    borderRadius: "50px",
    fontSize: "0.82rem",
    fontWeight: 600,
    border: "1.5px solid #f0e8e4",
    background: "#fff",
    color: "#6b6560",
    cursor: "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap" as const,
  },
  pillActive: {
    padding: "0.45rem 1rem",
    borderRadius: "50px",
    fontSize: "0.82rem",
    fontWeight: 700,
    border: "1.5px solid #c0392b",
    background: "#c0392b",
    color: "#fff",
    cursor: "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap" as const,
    boxShadow: "0 2px 8px rgba(192,57,43,0.25)",
  },
};
