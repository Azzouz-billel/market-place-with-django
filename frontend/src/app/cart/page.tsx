"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { cart, loading, updateItem, removeItem, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);

  async function handleApplyCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCouponError(null);
    const result = await applyCoupon(couponInput.trim());
    if (!result.ok) {
      setCouponError(result.error ?? "Could not apply coupon.");
      return;
    }
    setCouponInput("");
  }

  if (loading) {
    return <p className="py-16 text-center text-muted">Loading your cart…</p>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Your cart is empty</h1>
        <p className="text-muted">Browse the catalog and add something you like.</p>
        <Link
          href="/products"
          className="rounded-base bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Shop products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold tracking-tight">Your cart</h1>

      <ul className="flex flex-col divide-y divide-border border-y border-border" role="list">
        {cart.items.map((item) => {
          const image = item.variant.product_image;
          return (
            <li key={item.id} className="flex gap-4 py-4">
              <Link
                href={`/products/${item.variant.product_slug}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-base border border-border bg-card"
              >
                {image ? (
                  <Image
                    src={image.image}
                    alt={image.alt_text || item.variant.product_name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-muted">
                    No image
                  </span>
                )}
              </Link>

              <div className="flex flex-1 flex-col gap-1">
                <Link
                  href={`/products/${item.variant.product_slug}`}
                  className="font-medium hover:text-accent"
                >
                  {item.variant.product_name}
                </Link>
                <p className="text-sm text-muted">{item.variant.name}</p>
                <p className="text-sm text-muted">{formatPrice(item.variant.effective_price)} each</p>

                <div className="mt-auto flex items-center gap-3 pt-2">
                  <div className="inline-flex items-center rounded-base border border-border">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={item.quantity <= 1}
                      onClick={() => updateItem(item.id, item.quantity - 1)}
                      className="px-3 py-1 text-lg leading-none disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm" aria-live="polite">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={item.quantity >= item.variant.stock_quantity}
                      onClick={() => updateItem(item.id, item.quantity + 1)}
                      className="px-3 py-1 text-lg leading-none disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p className="font-semibold">{formatPrice(item.line_total)}</p>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col items-end gap-4">
        <div className="flex w-full max-w-xs flex-col gap-3">
          {cart.coupon_code ? (
            <div className="flex items-center justify-between rounded-base border border-border bg-card px-3 py-2 text-sm">
              <span>
                Coupon <span className="font-medium">{cart.coupon_code}</span> applied
              </span>
              <button
                type="button"
                onClick={() => removeCoupon()}
                className="text-muted hover:text-foreground"
              >
                Remove
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <label htmlFor="coupon" className="sr-only">Coupon code</label>
              <input
                id="coupon"
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value)}
                placeholder="Coupon code"
                className="flex-1 rounded-base border border-border bg-card px-3 py-2 text-sm uppercase outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
              />
              <button
                type="submit"
                disabled={!couponInput.trim()}
                className="rounded-base border border-border px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-50"
              >
                Apply
              </button>
            </form>
          )}
          {couponError && <p className="text-sm text-red-600 dark:text-red-400">{couponError}</p>}

          <div className="flex items-center justify-between text-sm text-muted">
            <span>Subtotal</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
          {Number(cart.discount) > 0 && (
            <div className="flex items-center justify-between text-sm text-accent">
              <span>Discount</span>
              <span>−{formatPrice(cart.discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-border pt-2 text-lg font-semibold">
            <span>Total</span>
            <span>{formatPrice(cart.total)}</span>
          </div>
        </div>
        <p className="text-sm text-muted">Shipping and taxes calculated at checkout.</p>
        <Link
          href="/checkout"
          className="w-full max-w-xs rounded-base bg-primary px-6 py-3 text-center font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
