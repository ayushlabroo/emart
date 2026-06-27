"use client";
// /product/:id — product detail + add to cart + reviews + review likho.
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getArticle } from "@/lib/api/catalog";
import { listReviews, createReview } from "@/lib/api/review";
import { getErrorMessage } from "@/lib/api/error";
import { formatINR } from "@/lib/format";
import { useAuthStore } from "@/lib/store/auth";
import { PageShell } from "@/components/PageShell";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "@/components/ui/RatingStars";
import { AddToCartButton } from "@/components/AddToCartButton";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();

  const articleQuery = useQuery({
    queryKey: ["article", id],
    queryFn: () => getArticle(id),
  });

  const reviewsQuery = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => listReviews(id),
  });

  if (articleQuery.isLoading) {
    return (
      <PageShell>
        <Spinner />
      </PageShell>
    );
  }

  if (articleQuery.isError || !articleQuery.data) {
    return (
      <PageShell>
        <p className="text-sm text-red-600">Product nahi mila.</p>
        <Link href="/" className="text-sm text-green-600 hover:underline">
          ← Home
        </Link>
      </PageShell>
    );
  }

  const article = articleQuery.data;
  const mrp = Number(article.mrp);
  const price = Number(article.price);
  const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <PageShell>
      {/* Breadcrumb (subcategory → category getArticleById se aata hai) */}
      <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
        <Link href="/" className="hover:text-green-600">
          Home
        </Link>
        {article.subcategory?.category && (
          <>
            <span>/</span>
            <Link
              href={`/category/${article.subcategory.category.id}`}
              className="hover:text-green-600"
            >
              {article.subcategory.category.name}
            </Link>
          </>
        )}
        {article.subcategory && (
          <>
            <span>/</span>
            <Link
              href={`/subcategory/${article.subcategory.id}`}
              className="hover:text-green-600"
            >
              {article.subcategory.name}
            </Link>
          </>
        )}
      </div>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="flex h-72 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
          {article.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.photo}
              alt={article.name}
              className="h-full w-full object-contain p-4"
            />
          ) : (
            <span className="text-7xl">🛒</span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{article.name}</h1>
          <span className="text-sm text-gray-400">{article.unit}</span>
          <RatingStars
            rating={article.avgRating}
            reviewCount={article.reviewCount}
            size="md"
          />

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">
              {formatINR(article.price)}
            </span>
            {discountPct > 0 && (
              <>
                <span className="text-base text-gray-400 line-through">
                  {formatINR(article.mrp)}
                </span>
                <span className="rounded-md bg-green-50 px-2 py-0.5 text-sm font-semibold text-green-700">
                  {discountPct}% OFF
                </span>
              </>
            )}
          </div>

          {article.description && (
            <p className="text-sm leading-relaxed text-gray-600">
              {article.description}
            </p>
          )}

          <div className="mt-2">
            <AddToCartButton articleId={article.id} className="px-6 py-2.5" />
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>

        {/* Review likhne ka form (sirf logged-in) */}
        <ReviewForm articleId={article.id} />

        <div className="mt-6 space-y-4">
          {reviewsQuery.isLoading ? (
            <Spinner />
          ) : !reviewsQuery.data || reviewsQuery.data.reviews.length === 0 ? (
            <p className="text-sm text-gray-400">
              Abhi koi review nahi — pehle tum likho!
            </p>
          ) : (
            reviewsQuery.data.reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-gray-100 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {r.customer.name}
                  </span>
                  <RatingStars rating={r.rating} />
                </div>
                {r.comment && (
                  <p className="mt-2 text-sm text-gray-600">{r.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </PageShell>
  );
}

// ─── ReviewForm ───────────────────────────────────────────────────────────────
// Sirf kharida hua (DELIVERED) product hi review ho sakta hai — backend check
// karta hai (NOT_PURCHASED / ALREADY_REVIEWED). Error message wahi dikhate hain.
function ReviewForm({ articleId }: { articleId: string }) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createReview({ articleId, rating, comment: comment || undefined }),
    onSuccess: () => {
      setComment("");
      setError(null);
      // Review list + article rating dono refresh
      queryClient.invalidateQueries({ queryKey: ["reviews", articleId] });
      queryClient.invalidateQueries({ queryKey: ["article", articleId] });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  if (!user) {
    return (
      <p className="mt-3 text-sm text-gray-500">
        Review likhne ke liye{" "}
        <Link href="/login" className="text-green-600 hover:underline">
          login
        </Link>{" "}
        karo.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
      {/* Clickable star rating */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i + 1)}
            className={
              i < rating
                ? "text-2xl text-yellow-400"
                : "text-2xl text-gray-300"
            }
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Product kaisa laga? (optional)"
        rows={3}
        className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <Button
        className="mt-3"
        loading={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        Review submit karo
      </Button>
    </div>
  );
}
