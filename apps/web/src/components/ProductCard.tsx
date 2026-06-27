// ─── ProductCard ──────────────────────────────────────────────────────────────
// Search results, subcategory listing — sab jagah same card. ProductLike type
// Article aur SearchResult dono satisfy karte hain, isliye reuse hota hai.
import Link from "next/link";
import type { ProductLike } from "@/lib/api/catalog";
import { formatINR } from "@/lib/format";
import { RatingStars } from "@/components/ui/RatingStars";
import { AddToCartButton } from "@/components/AddToCartButton";

export function ProductCard({ product }: { product: ProductLike }) {
  // mrp > price ho toh discount % nikaalo (badge ke liye)
  const mrp = Number(product.mrp);
  const price = Number(product.price);
  const discountPct =
    mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md">
      {/* Image area → product detail page */}
      <Link href={`/product/${product.id}`} className="relative block">
        {discountPct > 0 && (
          <span className="absolute left-1 top-1 z-10 rounded-md bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {discountPct}% OFF
          </span>
        )}
        <div className="flex h-32 items-center justify-center overflow-hidden rounded-xl bg-gray-50">
          {product.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.photo}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-4xl">🛒</span>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="mt-2 flex flex-1 flex-col gap-1">
        <Link
          href={`/product/${product.id}`}
          className="line-clamp-2 text-sm font-medium text-gray-800 hover:text-green-600"
        >
          {product.name}
        </Link>
        <span className="text-xs text-gray-400">{product.unit}</span>
        <RatingStars rating={product.avgRating} reviewCount={product.reviewCount} />
      </div>

      {/* Price + add */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900">
            {formatINR(product.price)}
          </span>
          {discountPct > 0 && (
            <span className="text-xs text-gray-400 line-through">
              {formatINR(product.mrp)}
            </span>
          )}
        </div>
        <AddToCartButton articleId={product.id} />
      </div>
    </div>
  );
}
