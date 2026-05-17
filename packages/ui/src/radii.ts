/**
 * Border radius scale in pixels.
 *
 * Consistent rounding is one of those subtle things that makes
 * a UI feel polished. Buttons, cards, inputs all using the same
 * radii is more important than picking the "right" values.
 */
export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999, // for pill shapes and circular avatars
} as const;
