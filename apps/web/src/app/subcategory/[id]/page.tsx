"use client";
// /subcategory/:id — us subcategory ke saare products (ProductCard grid)
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getArticlesBySubcategory } from "@/lib/api/catalog";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function SubcategoryPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["articles", "subcategory", id],
    queryFn: () => getArticlesBySubcategory(id),
  });

  return (
    <PageShell>
      <Link href="/" className="text-sm text-gray-500 hover:text-green-600">
        ← Home
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Products</h1>

      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-sm text-red-600">Products load nahi hue.</p>
        ) : !data || data.length === 0 ? (
          <EmptyState
            emoji="🛒"
            title="Koi product nahi"
            subtitle="Is subcategory mein abhi stock nahi hai."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {data.map((article) => (
              <ProductCard key={article.id} product={article} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
