"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Money from "@/components/Money";
import type { DashboardStats } from "@/types/dashboard";

const STATUS_ORDER = ["pending", "paid", "shipped", "delivered", "cancelled"];

export default function OverviewPanel() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        setStats(await res.json());
      }
    })();
  }, []);

  if (!stats) {
    return <p className="text-muted">Loading overview…</p>;
  }

  const tiles = [
    { label: "Revenue", value: <Money amount={stats.revenue} /> },
    { label: "Orders", value: stats.orders_total },
    { label: "Customers", value: stats.customers },
    { label: "Subscribers", value: stats.subscribers },
    { label: "Active products", value: `${stats.products_active} / ${stats.products_total}` },
  ];

  return (
    <div className="flex flex-col gap-10">
      <section aria-label="Key numbers" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col gap-1 rounded-base border border-border bg-card p-4">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">{tile.label}</span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight">{tile.value}</span>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Orders by status</h2>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((name) => (
            <span
              key={name}
              className="rounded-base border border-border bg-card px-3 py-1.5 text-sm capitalize"
            >
              {name}: <span className="font-semibold tabular-nums">{stats.orders_by_status[name] ?? 0}</span>
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Low stock (≤ 3 left)</h2>
          {stats.low_stock.length === 0 ? (
            <p className="text-sm text-muted">All variants are comfortably stocked.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-base border border-border bg-card" role="list">
              {stats.low_stock.map((variant) => (
                <li key={variant.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <Link href={`/products/${variant.product_slug}`} className="hover:text-accent">
                    {variant.product_name} <span className="text-muted">({variant.name} · {variant.sku})</span>
                  </Link>
                  <span className="font-semibold tabular-nums">
                    {variant.stock_quantity === 0 ? "Out" : `${variant.stock_quantity} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          {stats.recent_orders.length === 0 ? (
            <p className="text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-base border border-border bg-card" role="list">
              {stats.recent_orders.map((order) => (
                <li key={order.reference} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="flex flex-col">
                    <span className="font-mono text-xs">#{order.reference.slice(0, 8)}</span>
                    <span className="text-muted">{order.email}</span>
                  </span>
                  <span className="capitalize text-muted">{order.status}</span>
                  <span className="font-semibold tabular-nums"><Money amount={order.total} /></span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
