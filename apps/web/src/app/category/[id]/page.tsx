"use client";
// /category/:id — ek category ki subcategories grid. Click → /subcategory/:id
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getCategory, getSubcategoriesByCategory } from "@/lib/api/catalog";
import { PageShell } from "@/components/PageShell";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CategoryPage() {
  // useParams() dynamic route ka [id] deta hai (string | string[] — cast karo)
  const { id } = useParams<{ id: string }>();

  const categoryQuery = useQuery({
    queryKey: ["category", id],
    queryFn: () => getCategory(id),
  });

  const subQuery = useQuery({
    queryKey: ["subcategories", id],
    queryFn: () => getSubcategoriesByCategory(id),
  });

  return (
    <PageShell>
      <Link href="/" className="text-sm text-gray-500 hover:text-green-600">
        ← Home
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-gray-900">
        {categoryQuery.data?.name ?? "Category"}
      </h1>

      <div className="mt-6">
        {subQuery.isLoading ? (
          <Spinner />
        ) : subQuery.isError ? (
          <p className="text-sm text-red-600">Subcategories load nahi hui.</p>
        ) : !subQuery.data || subQuery.data.length === 0 ? (
          <EmptyState
            emoji="📦"
            title="Koi subcategory nahi"
            subtitle="Is category mein abhi kuch add nahi hua."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {subQuery.data.map((sub) => (
              <Link
                key={sub.id}
                href={`/subcategory/${sub.id}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-green-200 hover:shadow-md"
              >
                {sub.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sub.photo}
                    alt={sub.name}
                    className="h-16 w-16 object-contain"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-2xl font-bold text-green-600">
                    {sub.name.charAt(0)}
                  </div>
                )}
                <span className="text-center text-sm font-medium text-gray-700 group-hover:text-green-600">
                  {sub.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
