"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Category } from "@/types";
import { Utensils, Flame, Snowflake, Coffee, LayoutGrid } from "lucide-react";

interface CategoryFilterProps {
  categories: Category[];
}

// Lucide icons per category — no emojis
const categoryIcons: Record<string, React.ReactNode> = {
  Kukus: <Utensils size={18} strokeWidth={2} />,
  Goreng: <Flame size={18} strokeWidth={2} />,
  Frozen: <Snowflake size={18} strokeWidth={2} />,
  Minuman: <Coffee size={18} strokeWidth={2} />,
  Semua: <LayoutGrid size={18} strokeWidth={2} />,
};

const iconBgColors: Record<string, string> = {
  Kukus: "#fff0eb",
  Goreng: "#fff4e0",
  Frozen: "#eef2ff",
  Minuman: "#f0fdf4",
  Semua: "#fef2f2",
};

const iconColors: Record<string, string> = {
  Kukus: "#e87d6e",
  Goreng: "#f59e0b",
  Frozen: "#818cf8",
  Minuman: "#22c55e",
  Semua: "#c0392b",
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
    { label: "Semua", value: "" },
    ...categories.map((cat) => ({
      label: cat.name,
      value: cat.name,
    })),
  ];

  return (
    <div style={styles.wrap}>
      {allItems.map(({ label, value }) => {
        const isActive = activeCategory === value;
        const bg = iconBgColors[label] ?? "#fef2f2";
        const color = iconColors[label] ?? "#c0392b";
        const icon = categoryIcons[label] ?? <Utensils size={18} strokeWidth={2} />;

        return (
          <button
            key={value || "all"}
            onClick={() => handleSelect(value)}
            style={isActive ? { ...styles.card, ...styles.cardActive(color) } : styles.card}
          >
            {/* Icon circle */}
            <div style={{ ...styles.iconCircle, background: isActive ? color : bg, color: isActive ? "#fff" : color }}>
              {icon}
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

const styles: Record<string, any> = {
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
    minWidth: "88px",
    background: "#fff",
    border: "1.5px solid #f0e8e4",
    borderRadius: "14px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    boxShadow: "0 1px 4px rgba(45,42,38,0.05)",
  },
  cardActive: (color: string): React.CSSProperties => ({
    border: `1.5px solid ${color}`,
    boxShadow: `0 2px 10px ${color}26`,
    background: "#fff8f6",
  }),
  iconCircle: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s, color 0.15s",
  } as React.CSSProperties,
  label: {
    fontSize: "0.75rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
    transition: "color 0.15s",
  } as React.CSSProperties,
};
