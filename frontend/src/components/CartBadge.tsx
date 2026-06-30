"use client";

import Link from "next/link";

import { useCart } from "./CartProvider";

export default function CartBadge() {
  const { totalQuantity } = useCart();

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center gap-2 rounded-base px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
    >
      Cart
      {totalQuantity > 0 && (
        <span
          aria-label={`${totalQuantity} items in cart`}
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground"
        >
          {totalQuantity}
        </span>
      )}
    </Link>
  );
}
