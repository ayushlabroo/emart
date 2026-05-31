// apps/api/src/middleware/rate-limit.ts
import rateLimit from "express-rate-limit";

// rateLimit(...) ek READY-MADE middleware bana ke deta hai.
// Hamein khud (req, res, next) likhne ki zaroorat nahi — library ne kar diya.
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute ka time-window (milliseconds mein)
  max: 100, // har IP: iss 15 min mein max 100 requests
  standardHeaders: true, // limit ki info modern response headers mein bhejo
  legacyHeaders: false, // purane (X-RateLimit-*) headers band

  // Limit cross? Toh hamara CONSISTENT error shape bhejo (ApiError jaisa)
  message: {
    success: false,
    error: "Bahut zyada requests. Thodi der baad koshish karein.",
    code: "RATE_LIMITED",
  },
});
