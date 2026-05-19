"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TimelineSearch({
  initialQuery,
}: {
  initialQuery?: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/app/timeline?${params.toString()}`);
  };

  const handleClear = () => {
    setQuery("");
    router.push("/app/timeline");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="エントリを検索..."
        className="flex-1 px-0 py-2 bg-transparent border-b border-border text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-accent transition-colors"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-text-secondary/40 hover:text-text-secondary transition-colors"
        >
          クリア
        </button>
      )}
      <button
        type="submit"
        className="text-xs text-text-secondary tracking-wide hover:text-accent transition-colors"
      >
        検索
      </button>
    </form>
  );
}
