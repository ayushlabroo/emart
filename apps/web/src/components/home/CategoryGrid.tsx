"use client";
// ─── CategoryGrid ─────────────────────────────────────────────────────────────
// Pehli baar TanStack Query (`useQuery`) use ho raha hai — server se data laane ka
// senior tareeka. Manual useState/useEffect/loading/error ka jhanjhat khatam.

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/lib/api/catalog";

export function CategoryGrid() {
  // useQuery do cheezein maangta hai:
  //   queryKey → is data ki "ID" (cache mein isi naam se store hota hai). Array hota
  //              hai taaki params add kar sako, jaise ["categories", page].
  //   queryFn  → woh async function jo actual data laata hai (Promise return kare).
  //
  // Wapas milta hai: data, isLoading (pehli baar fetch ho raha hai),
  //                  isError + error (fail hua). Inhe destructure kar lete hain.
  const {
    data: categories,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // ── State 1: Loading — skeleton placeholders dikhao (blank screen se behtar) ──
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* Array.from({ length: 8 }) → 8 khaali "ghost" cards */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  // ── State 2: Error — API fail hui (server down, network issue) ──
  if (isError) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-6 text-center text-sm text-red-600">
        Categories load nahi ho payi. Thodi der baad try karo.
      </div>
    );
  }

  // ── State 3: Empty — request to chali, par koi category nahi hai ──
  if (!categories || categories.length === 0) {
    return (
      <p className="text-center text-sm text-gray-400 py-6">
        Abhi koi category nahi hai.
      </p>
    );
  }

  // ── State 4: Success — grid render karo ──
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.id}`}
          className="group rounded-2xl border border-gray-100 bg-white p-4 flex flex-col items-center gap-3 shadow-sm hover:shadow-md hover:border-green-200 transition"
        >
          {/* photo ho toh image, warna naam ka pehla letter (fallback avatar) */}
          {cat.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cat.photo}
              alt={cat.name}
              className="h-16 w-16 object-contain"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-2xl font-bold">
              {cat.name.charAt(0)}
            </div>
          )}
          <span className="text-sm font-medium text-gray-700 text-center group-hover:text-green-600">
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
