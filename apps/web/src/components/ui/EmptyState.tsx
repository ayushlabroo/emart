// Khaali states ke liye ek consistent block — empty cart, no orders, no results.
// emoji + title + optional subtitle + optional action button (children).
export function EmptyState({
  emoji = "📭",
  title,
  subtitle,
  children,
}: {
  emoji?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="text-5xl">{emoji}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="max-w-sm text-sm text-gray-500">{subtitle}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
