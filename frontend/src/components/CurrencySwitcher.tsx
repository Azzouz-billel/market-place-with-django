"use client";

import { useCurrency } from "@/components/CurrencyProvider";

export default function CurrencySwitcher() {
  const { currencies, selected, setCurrency } = useCurrency();

  if (currencies.length <= 1) {
    return null;
  }

  return (
    <label>
      <span className="sr-only">Currency</span>
      <select
        value={selected?.code ?? ""}
        onChange={(event) => setCurrency(event.target.value)}
        className="rounded-base border border-border bg-card px-2 py-1.5 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {currencies.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code} {currency.symbol}
          </option>
        ))}
      </select>
    </label>
  );
}
