// Read-only star rating display. rating 0–5 (float allowed). Filled stars =
// Math.round(rating). reviewCount optional — "(12)" jaisa dikhane ke liye.
import { cn } from "@/lib/cn";

export function RatingStars({
  rating,
  reviewCount,
  size = "sm",
}: {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
}) {
  const filled = Math.round(rating);
  const starClass = size === "md" ? "text-lg" : "text-sm";

  return (
    <div className="flex items-center gap-1">
      <div className={cn("flex", starClass)}>
        {/* 5 stars — index < filled hone pe golden, warna grey */}
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < filled ? "text-yellow-400" : "text-gray-300"}>
            ★
          </span>
        ))}
      </div>
      {reviewCount !== undefined && (
        <span className="text-xs text-gray-500">
          {rating > 0 ? rating.toFixed(1) : "New"}
          {reviewCount > 0 && ` (${reviewCount})`}
        </span>
      )}
    </div>
  );
}
