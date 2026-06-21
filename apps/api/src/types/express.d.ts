// Express ke Request interface mein 'user' add kar rahe hain — declaration merging.
// Yeh file runtime pe exist nahi karti, sirf TypeScript ke liye hai.
import type { UserRole } from "@emart/types";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
      };
      // Razorpay webhook signature verify karne ke liye raw bytes chahiye.
      // express.json() ke verify callback mein set hota hai (app.ts).
      rawBody?: Buffer;
    }
  }
}
