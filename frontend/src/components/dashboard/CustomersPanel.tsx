"use client";

import { useEffect, useState } from "react";

import type { Customer } from "@/types/dashboard";

export default function CustomersPanel() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/dashboard/customers");
      if (res.ok) {
        setCustomers(await res.json());
      }
    })();
  }, []);

  if (!customers) {
    return <p className="text-muted">Loading customers…</p>;
  }

  return (
    <div className="overflow-x-auto rounded-base border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Joined</th>
            <th className="px-4 py-3 font-medium">Orders</th>
            <th className="px-4 py-3 font-medium">Role</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td className="px-4 py-3 font-medium">{customer.email}</td>
              <td className="px-4 py-3 text-muted">
                {[customer.first_name, customer.last_name].filter(Boolean).join(" ") || "—"}
              </td>
              <td className="px-4 py-3 text-muted">
                {new Date(customer.date_joined).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 tabular-nums">{customer.order_count}</td>
              <td className="px-4 py-3 text-muted">{customer.is_staff ? "Staff" : "Customer"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
