// Money formatting. API se price fields Prisma Decimal → JSON mein string banke
// aate hain (e.g. "178.00"). Cart subtotal bhi string hota hai. Isliye input
// string | number dono accept karte hain, Number() se convert karke format karo.
//
// Intl.NumberFormat = browser ka built-in formatter. "en-IN" + INR → ₹1,234.50
// (Indian comma grouping: ₹1,00,000 jaisa).
const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatINR(value: string | number): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "₹0";
  return inrFormatter.format(num);
}

// Razorpay/order amount paise mein hota hai (₹1 = 100 paise). Display ke liye ÷100.
export function paiseToINR(paise: number): string {
  return formatINR(paise / 100);
}
