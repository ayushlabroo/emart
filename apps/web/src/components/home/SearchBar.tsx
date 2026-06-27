"use client";
// ─── SearchBar ────────────────────────────────────────────────────────────────
// Controlled input: jo user type karta hai woh React state (`q`) mein rehta hai.
// Submit pe /search?q=... pe navigate karte hain (results page agle step mein).

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault(); // browser ka default page-reload roko (SPA navigation chahiye)

    const trimmed = q.trim();
    if (!trimmed) return; // khaali search mat bhejo

    // encodeURIComponent: space → %20, & → %26 etc — URL todne se bachata hai
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        type="search"
        placeholder="Doodh, bread, eggs... kuch bhi dhoondo"
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </form>
  );
}
