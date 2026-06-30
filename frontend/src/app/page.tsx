import Link from "next/link";

import ProductGrid from "@/components/ProductGrid";
import { getProducts } from "@/lib/api";

// Rendered per request so the build never needs the API reachable (e.g. in Docker).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { results } = await getProducts({ ordering: "-created_at" });
  const featured = results.slice(0, 8);

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col items-start gap-4 rounded-base border border-border bg-card px-6 py-16 sm:px-12">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">New arrivals</p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Considered goods, quietly made.
        </h1>
        <p className="max-w-xl text-muted">
          A small, curated catalog of apparel, footwear, and accessories. Browse the
          latest below or explore everything in the shop.
        </p>
        <Link
          href="/products"
          className="rounded-base bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Shop all products
        </Link>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Latest products</h2>
          <Link href="/products" className="text-sm text-muted hover:text-foreground">
            View all
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>
    </div>
  );
}
