"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { useCart } from "@/components/CartProvider";
import Money from "@/components/Money";
import type { Order } from "@/types/order";

function SuccessInner() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("ref");
  const { refresh } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const confirmed = useRef(false);

  useEffect(() => {
    if (!reference || confirmed.current) {
      return;
    }
    confirmed.current = true;
    fetch("/api/checkout/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail ?? "We couldn't confirm your order.");
        }
        setOrder(data);
        await refresh();
      })
      .catch((err: Error) => setError(err.message));
  }, [reference, refresh]);

  if (!reference) {
    return <p className="py-16 text-center text-muted">Missing order reference.</p>;
  }
  if (error) {
    return <p className="py-16 text-center text-red-600 dark:text-red-400">{error}</p>;
  }
  if (!order) {
    return <p className="py-16 text-center text-muted">Confirming your order…</p>;
  }

  const isPaid = order.status !== "pending";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {isPaid ? "Thank you for your order!" : "Order received"}
        </h1>
        <p className="text-muted">
          {isPaid
            ? `A confirmation has been sent to ${order.email}.`
            : "Your order is pending payment confirmation."}
        </p>
        <p className="text-sm text-muted">
          Order reference: <span className="font-mono">{order.reference}</span>
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-base border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Summary</h2>
        <ul className="flex flex-col gap-3" role="list">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 text-sm">
              <span>
                {item.quantity} × {item.product_name}
                <span className="text-muted"> ({item.variant_name})</span>
              </span>
              <span className="font-medium"><Money amount={item.line_total} /></span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <div className="flex justify-between text-sm text-muted">
            <span>Subtotal</span>
            <span><Money amount={order.subtotal} /></span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-sm text-accent">
              <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
              <span>−<Money amount={order.discount} /></span>
            </div>
          )}
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span><Money amount={order.total} /></span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-1 text-sm text-muted">
        <h2 className="mb-1 text-base font-semibold text-foreground">Shipping to</h2>
        <p>{order.shipping_name}</p>
        <p>{order.shipping_line1}</p>
        {order.shipping_line2 && <p>{order.shipping_line2}</p>}
        <p>
          {order.shipping_city}
          {order.shipping_state && `, ${order.shipping_state}`} {order.shipping_postal_code}
        </p>
        <p>{order.shipping_country}</p>
      </section>

      <Link
        href="/products"
        className="self-start rounded-base bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Continue shopping
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-muted">Loading…</p>}>
      <SuccessInner />
    </Suspense>
  );
}
