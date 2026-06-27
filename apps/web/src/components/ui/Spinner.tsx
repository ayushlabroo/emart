// Full-area loading spinner — jab pura page ya section load ho raha ho.
import { cn } from "@/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-16", className)}>
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
    </div>
  );
}
