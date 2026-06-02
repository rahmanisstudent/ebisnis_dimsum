"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

export default function ProductSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSearch(val: string) {
    setQuery(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set("search", val);
    } else {
      params.delete("search");
    }
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <Search
        size={15}
        style={{
          position: "absolute",
          left: "1rem",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#b0aaa4",
          pointerEvents: "none",
        }}
      />
      <input
        type="text"
        placeholder="Search delicious dimsum..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "0.6rem 2.5rem 0.6rem 2.5rem",
          border: "1.5px solid #f0e8e4",
          borderRadius: "50px",
          fontSize: "0.875rem",
          background: "#fff8f5",
          color: "#2d2a26",
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#e87d6e";
          e.target.style.boxShadow = "0 0 0 3px rgba(232,125,110,0.12)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#f0e8e4";
          e.target.style.boxShadow = "none";
        }}
      />
      {query && (
        <button
          onClick={() => handleSearch("")}
          style={{
            position: "absolute",
            right: "0.875rem",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#b0aaa4",
            display: "flex",
            alignItems: "center",
            padding: 0,
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
