// ─── Razorpay checkout loader ─────────────────────────────────────────────────
// Razorpay ka checkout.js ek external script hai jo `window.Razorpay` global deta
// hai. Use karne se pehle dynamically load karna padta hai (npm package nahi).

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;        // public key_id (secret kabhi nahi)
  amount: number;     // paise mein
  currency: string;
  order_id: string;   // backend se aaya razorpayOrderId
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void; // payment success callback
  modal?: { ondismiss?: () => void };            // user ne dialog band kiya
}

interface RazorpayInstance {
  open: () => void;
}
type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

// window.Razorpay ko TypeScript batao (script load hone ke baad available hota hai)
declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

// Script <body> mein inject karo. Pehle se loaded ho toh turant true.
// Promise<boolean> — true = ready, false = load fail.
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
