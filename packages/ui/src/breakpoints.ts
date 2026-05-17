/**
 * Responsive breakpoints in pixels (web only).
 *
 * Mobile doesn't use these — React Native apps know they're on
 * a phone-sized screen. These are for the Next.js web app's
 * responsive design (configured into Tailwind in Step 13).
 *
 * The values match Tailwind's defaults, which match the most
 * common device sizes in 2026.
 */
export const breakpoints = {
  sm: 640, // small tablets, large phones in landscape
  md: 768, // tablets
  lg: 1024, // laptops
  xl: 1280, // desktops
  "2xl": 1536, // large desktops
} as const;
