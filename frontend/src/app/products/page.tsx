import type { Metadata } from "next";

import Filters from "@/components/Filters";
import Pagination from "@/components/Pagination";
import ProductGrid from "@/components/ProductGrid";
import { getCategories, getProducts, type ProductQuery } from "@/lib/api";

export const metadata: Metadata = {
  title: "All products",
  description: "Browse the full Lumen catalog. Filter by category and price, sort, and search.",
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const query: ProductQuery = {
    category: first(params.category),
    search: first(params.search),
    ordering: first(params.ordering),
    min_price: first(params.min_price),
    max_price: first(params.max_price),
    page: first(params.page),
  };

  const [productsPage, categories] = await Promise.all([
    getProducts(query),
    getCategories(),
  ]);

  const currentPage = Number(query.page ?? "1");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">All products</h1>
        <p className="text-muted">{productsPage.count} products</p>
      </header>

      <Filters categories={categories} />

      <ProductGrid products={productsPage.results} />

      <Pagination count={productsPage.count} page={currentPage} />
    </div>
  );
}
