"use client";

import { useEffect, useState } from "react";

import Money from "@/components/Money";
import type { Order } from "@/types/order";

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/account/orders");
        setOrders(res.ok ? await res.json() : []);
      } catch {
        setOrders([]);
      }
    })();
  }, []);

  if (orders === null) {
    return <p className="text-muted">Loading orders…</p>;
  }
  if (orders.length === 0) {
    return <p className="text-muted">You haven&apos;t placed any orders yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-4" role="list">
      {orders.map((order) => (
        <li key={order.reference} className="rounded-base border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="font-mono text-sm">#{order.reference.slice(0, 8)}</span>
              <span className="text-xs text-muted">
                {new Date(order.created_at).toLocaleDateString()}
              </span>
            </div>
            <span className="rounded-base bg-background px-2 py-1 text-xs font-medium capitalize">
              {order.status}
            </span>
            <span className="font-semibold"><Money amount={order.total} /></span>
          </div>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-muted" role="list">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.quantity} × {item.product_name} ({item.variant_name})
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
