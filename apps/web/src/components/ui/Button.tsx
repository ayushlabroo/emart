// Reusable Button — pure app mein consistent dikhne ke liye. variant se color,
// size se padding control hota hai. `...props` se native button ke saare attributes
// (onClick, disabled, type) pass-through ho jaate hain.
//
// Yeh wahi pattern hai jo shadcn/ui use karta hai — baad mein chaaho toh swap aasaan.
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-green-600 hover:bg-green-700 text-white disabled:bg-green-400",
  secondary: "bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-400",
  outline:
    "border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 disabled:opacity-50",
  ghost: "hover:bg-gray-100 text-gray-700 disabled:opacity-50",
  danger: "bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      // loading hone pe bhi disable — double-submit se bachao
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && (
        // chhota inline spinner — loading state mein dikhta hai
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
