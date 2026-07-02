"use client";

import { useCallback, useEffect, useState } from "react";

import Money from "@/components/Money";
import type { Order } from "@/types/order";
import type { PaginatedOrders } from "@/types/dashboard";

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];

export default function OrdersPanel() {
  const [data, setData] = useState<PaginatedOrders | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter) {
      params.set("status", statusFilter);
    }
    const res = await fetch(`/api/dashboard/orders?${params}`);
    if (res.ok) {
      setData(await res.json());
    }
  }, [page, statusFilter]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  async function updateStatus(order: Order, status: string) {
    const res = await fetch(`/api/dashboard/orders/${order.reference}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await load();
    }
  }

  if (!data) {
    return <p className="text-muted">Loading orders…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <label htmlFor="status-filter" className="text-sm font-medium">Filter by status</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value);
          }}
          className="rounded-base border border-border bg-card px-3 py-2 text-sm capitalize outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <option value="">All</option>
          {STATUSES.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <span className="ml-auto text-sm text-muted tabular-nums">{data.count} orders</span>
      </div>

      {data.results.length === 0 ? (
        <p className="text-muted">No orders match this filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-base border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.results.map((order) => (
                <tr key={order.reference}>
                  <td className="px-4 py-3 font-mono text-xs">#{order.reference.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <span className="flex flex-col">
                      <span>{order.shipping_name}</span>
                      <span className="text-xs text-muted">{order.email}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {order.items.map((item) => `${item.quantity}× ${item.product_name}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums"><Money amount={order.total} /></td>
                  <td className="px-4 py-3 text-muted">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <label className="sr-only" htmlFor={`status-${order.reference}`}>
                      Status for order {order.reference.slice(0, 8)}
                    </label>
                    <select
                      id={`status-${order.reference}`}
                      value={order.status}
                      onChange={(event) => updateStatus(order, event.target.value)}
                      className="rounded-base border border-border bg-background px-2 py-1.5 text-sm capitalize outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
                    >
                      {STATUSES.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={!data.previous}
          onClick={() => setPage((current) => current - 1)}
          className="rounded-base border border-border px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!data.next}
          onClick={() => setPage((current) => current + 1)}
          className="rounded-base border border-border px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
