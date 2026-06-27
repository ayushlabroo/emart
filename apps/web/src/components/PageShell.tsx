// Har page ka common wrapper: Header + centered max-width container.
// Repeat na karna pade isliye ek jagah.
import { Header } from "@/components/home/Header";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </main>
  );
}
