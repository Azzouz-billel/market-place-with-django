"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Money from "@/components/Money";
import type { DashboardProduct } from "@/types/dashboard";

export default function ProductsPanel() {
  const [products, setProducts] = useState<DashboardProduct[] | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/dashboard/products");
      if (res.ok) {
        setProducts(await res.json());
      }
    })();
  }, []);

  async function toggleActive(product: DashboardProduct) {
    const res = await fetch(`/api/dashboard/products/${product.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !product.is_active }),
    });
    if (res.ok) {
      const updated: DashboardProduct = await res.json();
      setProducts((current) =>
        current ? current.map((p) => (p.id === updated.id ? updated : p)) : current,
      );
    }
  }

  if (!products) {
    return <p className="text-muted">Loading products…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Toggle visibility here; for images, variants, and prices use the full Django admin.
      </p>
      <div className="overflow-x-auto rounded-base border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Variants</th>
              <th className="px-4 py-3 font-medium">Visibility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => (
              <tr key={product.id} className={product.is_active ? "" : "opacity-60"}>
                <td className="px-4 py-3">
                  <Link href={`/products/${product.slug}`} className="font-medium hover:text-accent">
                    {product.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{product.category_name}</td>
                <td className="px-4 py-3 tabular-nums"><Money amount={product.base_price} /></td>
                <td className="px-4 py-3 tabular-nums">
                  {product.total_stock === 0 ? (
                    <span className="font-semibold">Out of stock</span>
                  ) : (
                    `${product.total_stock} units`
                  )}
                </td>
                <td className="px-4 py-3 text-muted">
                  {product.variants.map((v) => `${v.name} (${v.stock_quantity})`).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleActive(product)}
                    aria-pressed={product.is_active}
                    className={`rounded-base border px-3 py-1.5 text-sm font-medium transition-colors ${
                      product.is_active
                        ? "border-border hover:border-accent"
                        : "border-accent text-accent"
                    }`}
                  >
                    {product.is_active ? "Live — hide it" : "Hidden — publish"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
