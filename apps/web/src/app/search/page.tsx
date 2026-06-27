"use client";
// /search?q=... — full-text search results (backend Postgres FTS).
//
// useSearchParams() ko Next.js build pe <Suspense> boundary chahiye, warna
// "should be wrapped in a suspense boundary" error aata hai. Isliye actual
// results component ko Suspense ke andar render karte hain.
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { searchArticles } from "@/lib/api/catalog";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

function SearchResults() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const { data, isLoading, isError } = useQuery({
    // queryKey mein `q` daala — query badle toh apne aap naya fetch hota hai
    queryKey: ["search", q],
    queryFn: () => searchArticles(q),
    enabled: q.length > 0, // khaali query pe fetch mat karo
  });

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">
        &ldquo;{q}&rdquo; ke results
      </h1>

      <div className="mt-6">
        {!q ? (
          <EmptyState emoji="🔎" title="Kuch search karo" />
        ) : isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-sm text-red-600">Search fail hui.</p>
        ) : !data || data.length === 0 ? (
          <EmptyState
            emoji="🤷"
            title="Kuch nahi mila"
            subtitle={`"${q}" ke liye koi product nahi. Kuch aur try karo.`}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {data.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <PageShell>
      <Suspense fallback={<Spinner />}>
        <SearchResults />
      </Suspense>
    </PageShell>
  );
}
