"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import type { Category } from "@/types/catalog";

const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest" },
  { value: "base_price", label: "Price: low to high" },
  { value: "-base_price", label: "Price: high to low" },
  { value: "name", label: "Name: A–Z" },
];

const selectClass =
  "rounded-base border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40";

export default function Filters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");

  // Build a new query from the current one, resetting pagination on any change.
  function withParam(key: string, value: string): string {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    const qs = params.toString();
    return `${pathname}${qs ? `?${qs}` : ""}`;
  }

  function navigate(key: string, value: string) {
    router.push(withParam(key, value));
  }

  function applyPriceRange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) {
      params.set("min_price", minPrice);
    } else {
      params.delete("min_price");
    }
    if (maxPrice) {
      params.set("max_price", maxPrice);
    } else {
      params.delete("max_price");
    }
    params.delete("page");
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-category" className="text-xs font-medium text-muted">
          Category
        </label>
        <select
          id="filter-category"
          className={selectClass}
          value={searchParams.get("category") ?? ""}
          onChange={(event) => navigate("category", event.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-sort" className="text-xs font-medium text-muted">
          Sort by
        </label>
        <select
          id="filter-sort"
          className={selectClass}
          value={searchParams.get("ordering") ?? "-created_at"}
          onChange={(event) => navigate("ordering", event.target.value)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={applyPriceRange} className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-min" className="text-xs font-medium text-muted">
            Min price
          </label>
          <input
            id="filter-min"
            type="number"
            min="0"
            inputMode="decimal"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            className={`${selectClass} w-24`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-max" className="text-xs font-medium text-muted">
            Max price
          </label>
          <input
            id="filter-max"
            type="number"
            min="0"
            inputMode="decimal"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            className={`${selectClass} w-24`}
          />
        </div>
        <button
          type="submit"
          className="rounded-base bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Apply
        </button>
      </form>
    </div>
  );
}
