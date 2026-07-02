"use client";

import { useState } from "react";

import type { ProductVariant } from "@/types/catalog";
import { useCart } from "./CartProvider";
import { useCurrency } from "./CurrencyProvider";

type Status = { kind: "idle" | "success" | "error"; message?: string };

export default function VariantSelector({ variants }: { variants: ProductVariant[] }) {
  const { addItem } = useCart();
  const { format } = useCurrency();
  const firstAvailable = variants.find((variant) => variant.in_stock) ?? null;
  const [selectedId, setSelectedId] = useState<number | null>(firstAvailable?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const selected = variants.find((variant) => variant.id === selectedId) ?? null;
  const canAdd = selected !== null && selected.in_stock && !pending;

  async function handleAdd() {
    if (!selected) {
      return;
    }
    setPending(true);
    setStatus({ kind: "idle" });
    const result = await addItem(selected.id, quantity);
    setPending(false);
    setStatus(
      result.ok
        ? { kind: "success", message: "Added to cart." }
        : { kind: "error", message: result.error },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Options</legend>
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => {
            const isSelected = variant.id === selectedId;
            return (
              <button
                key={variant.id}
                type="button"
                disabled={!variant.in_stock}
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedId(variant.id);
                  setQuantity(1);
                  setStatus({ kind: "idle" });
                }}
                className={`rounded-base border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 ${
                  isSelected ? "border-accent bg-accent/10" : "border-border hover:border-accent"
                }`}
              >
                {variant.name}
                {!variant.in_stock && " — sold out"}
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className="text-sm text-muted" aria-live="polite">
        {selected
          ? `${selected.name}: ${format(selected.effective_price)} · ${
              selected.in_stock ? `${selected.stock_quantity} in stock` : "Out of stock"
            }`
          : "Select an option to see price and availability."}
      </p>

      <div className="flex items-center gap-3">
        <label htmlFor="quantity" className="text-sm font-medium">
          Quantity
        </label>
        <input
          id="quantity"
          type="number"
          min={1}
          max={selected?.stock_quantity ?? 1}
          value={quantity}
          disabled={!selected?.in_stock}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
          className="w-20 rounded-base border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-40"
        />
      </div>

      <button
        type="button"
        disabled={!canAdd}
        onClick={handleAdd}
        className="w-full rounded-base bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add to cart"}
      </button>

      {status.kind !== "idle" && (
        <p
          aria-live="assertive"
          className={`text-sm ${status.kind === "success" ? "text-accent" : "text-red-600 dark:text-red-400"}`}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
