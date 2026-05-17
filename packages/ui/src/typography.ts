/**
 * Typography tokens.
 *
 * Font sizes follow a modular scale (each step ~1.2x the previous).
 * This produces a visual hierarchy that feels harmonious — text
 * sizes that don't follow a scale tend to look chaotic.
 *
 * Font weights use numeric values (the CSS standard). 400 = normal,
 * 700 = bold. React Native supports the same numeric weights.
 */
export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16, // the default body text size
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  // Line height as a multiplier of font size. 1.5 is comfortable
  // for body text; tighter values (1.2) work for headings.
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;
