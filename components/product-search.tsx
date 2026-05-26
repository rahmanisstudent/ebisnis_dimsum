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
    <div className="relative w-full max-w-md">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60" size={16} />
      <input
        type="text"
        placeholder="Cari dimsum favoritmu..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full pl-10 pr-10 py-3 border border-border-soft rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white"
      />
      {query && (
        <button
          onClick={() => handleSearch("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main p-0.5 rounded-full"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
