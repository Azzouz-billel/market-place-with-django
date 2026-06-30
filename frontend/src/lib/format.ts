const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Format a DRF decimal string (e.g. "24.00") as a price. */
export function formatPrice(value: string): string {
  return currency.format(Number(value));
}
