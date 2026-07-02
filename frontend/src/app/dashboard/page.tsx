"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import CustomersPanel from "@/components/dashboard/CustomersPanel";
import OrdersPanel from "@/components/dashboard/OrdersPanel";
import OverviewPanel from "@/components/dashboard/OverviewPanel";
import ProductsPanel from "@/components/dashboard/ProductsPanel";

const TABS = ["Overview", "Orders", "Products", "Customers"] as const;
type Tab = (typeof TABS)[number];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Overview");

  useEffect(() => {
    if (!loading && (!user || !user.is_staff)) {
      router.replace(user ? "/" : "/login");
    }
  }, [loading, user, router]);

  if (loading || !user?.is_staff) {
    return <p className="py-16 text-center text-muted">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">Back office</p>
          <h1 className="text-3xl font-semibold tracking-tight">Store dashboard</h1>
        </div>
        <a
          href={process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://127.0.0.1:8000/admin/"}
          target="_blank"
          rel="noreferrer"
          className="rounded-base border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-accent"
        >
          Open full Django admin ↗
        </a>
      </header>

      <nav aria-label="Dashboard sections" className="flex gap-1 border-b border-border">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            aria-current={tab === name ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              tab === name
                ? "border-accent text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {name}
          </button>
        ))}
      </nav>

      {tab === "Overview" && <OverviewPanel />}
      {tab === "Orders" && <OrdersPanel />}
      {tab === "Products" && <ProductsPanel />}
      {tab === "Customers" && <CustomersPanel />}
    </div>
  );
}
