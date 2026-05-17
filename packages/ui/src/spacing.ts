/**
 * Spacing scale in pixels.
 *
 * A scale (rather than arbitrary values) keeps the UI consistent.
 * Designers and developers reach for `spacing.md` instead of
 * making up "16px here, 18px there, 14px somewhere else".
 *
 * The scale roughly doubles, which gives visually distinct steps.
 * This matches the scale Tailwind uses (`p-1` = 4px, `p-2` = 8px,
 * `p-4` = 16px, etc.).
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
} as const;
