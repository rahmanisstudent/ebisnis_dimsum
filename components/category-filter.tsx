"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Category } from "@/types";

interface CategoryFilterProps {
  categories: Category[];
}

// Warna latar icon per kategori
const iconBgColors: Record<string, string> = {
  "Kukus":        "#fff0eb",
  "Goreng":       "#fff4e0",
  "Frozen":       "#eef2ff",
  "Minuman":      "#f0fdf4",
  "Semua":        "#fff0eb",
};
const iconColors: Record<string, string> = {
  "Kukus":        "#e87d6e",
  "Goreng":       "#f59e0b",
  "Frozen":       "#818cf8",
  "Minuman":      "#22c55e",
  "Semua":        "#c0392b",
};
const categoryEmojis: Record<string, string> = {
  "Kukus":        "🥟",
  "Goreng":       "🍳",
  "Frozen":       "❄️",
  "Minuman":      "🧋",
  "Semua":        "🍽️",
};

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
    { label: "Semua", value: "", emoji: categoryEmojis["Semua"] },
    ...categories.map((cat) => ({
      label: cat.name,
      value: cat.name,
      emoji: cat.emoji ?? categoryEmojis[cat.name] ?? "🥟",
    })),
  ];

  return (
    <div style={styles.wrap}>
      {allItems.map(({ label, value, emoji }) => {
        const isActive = activeCategory === value;
        const bg = iconBgColors[label] ?? "#fff0eb";
        const color = iconColors[label] ?? "#c0392b";

        return (
          <button
            key={value || "all"}
            onClick={() => handleSelect(value)}
            style={isActive ? { ...styles.card, ...styles.cardActive } : styles.card}
          >
            {/* Icon circle */}
            <div style={{ ...styles.iconCircle, background: isActive ? color : bg }}>
              <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{emoji}</span>
            </div>
            {/* Label */}
            <span style={{ ...styles.label, color: isActive ? color : "#6b6560" }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    justifyContent: "center",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.875rem 1.25rem",
    minWidth: "90px",
    background: "#fff",
    border: "1.5px solid #f0e8e4",
    borderRadius: "14px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    boxShadow: "0 1px 4px rgba(45,42,38,0.05)",
  },
  cardActive: {
    border: "1.5px solid #c0392b",
    boxShadow: "0 2px 10px rgba(192,57,43,0.15)",
    background: "#fff8f6",
  },
  iconCircle: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
    transition: "color 0.15s",
  },
};
