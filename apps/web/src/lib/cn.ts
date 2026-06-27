// cn = "className" helper. Multiple class strings ko jodta hai, falsy (undefined,
// false, "") ko skip karta hai. Conditional classes likhne ke liye:
//   cn("p-4", isActive && "bg-green-600", error && "border-red-500")
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
