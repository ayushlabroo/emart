// page.tsx at root = localhost:3001/
// Yeh Server Component hai (koi hook nahi) — sirf client components compose karta hai.
// Header / SearchBar / CategoryGrid apne andar "use client" hain — interactivity wahan.
import { Header } from "@/components/home/Header";
import { SearchBar } from "@/components/home/SearchBar";
import { CategoryGrid } from "@/components/home/CategoryGrid";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Hero + search */}
        <section className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Minutes mein delivery 🛵
          </h1>
          <p className="text-sm text-gray-500">
            Apne aas-paas ke dark store se groceries order karo.
          </p>
          <SearchBar />
        </section>

        {/* Categories */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Categories
          </h2>
          <CategoryGrid />
        </section>
      </div>
    </main>
  );
}
