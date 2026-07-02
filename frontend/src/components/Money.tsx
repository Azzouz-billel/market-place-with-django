"use client";

import { useCurrency } from "@/components/CurrencyProvider";

/** Renders a base-USD decimal string in the shopper's selected currency. */
export default function Money({ amount }: { amount: string }) {
  const { format } = useCurrency();
  return <>{format(amount)}</>;
}
