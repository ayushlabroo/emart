/*** EMart color palette.
 *
 * Structure:
 * - `brand`: primary identity colors (the EMart "look")
 * - `semantic`: meaning-based colors (success = green, danger = red)
 * - `neutral`: greys for text, borders, backgrounds
 *
 * The numeric scale (50, 100, ..., 900) follows the Tailwind
 * convention. 500 is the "default" weight for each hue; 50 is
 * lightest (good for backgrounds), 900 is darkest (good for text
 * on light backgrounds).

*/

export const colors = {
  brand: {
    primary: "#FF6B35", // warm orange — main CTAs, brand accents
    primaryDark: "#E85A2B", // hover / pressed state
    primaryLight: "#FFE5DA", // backgrounds, soft highlights
    secondary: "#2EC4B6", // teal — secondary actions, accents
  },
  semantic: {
    success: "#10B981", // confirmations, "order delivered"
    warning: "#F59E0B", // "low stock", "order delayed"
    danger: "#EF4444", // errors, "order cancelled"
    info: "#3B82F6", // informational messages
  },
  neutral: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  white: "#FFFFFF",
  black: "#000000",
} as const;
