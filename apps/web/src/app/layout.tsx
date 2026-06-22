// layout.tsx = har page ke around ka wrapper
// Metadata = browser tab ka title + description (Next.js automatically <head> mein inject karta hai)
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EMart",
  description: "Your neighbourhood dark store",
};

// children = jo bhi page is layout ke andar render hoga (page.tsx, login/page.tsx etc)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
