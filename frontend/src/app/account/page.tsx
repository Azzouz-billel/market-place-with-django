"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import AddressBook from "@/components/AddressBook";
import { useAuth } from "@/components/AuthProvider";
import OrderHistory from "@/components/OrderHistory";

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <p className="py-16 text-center text-muted">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">My account</h1>
        <p className="text-muted">{user.email}</p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Order history</h2>
        <OrderHistory />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Saved addresses</h2>
        <AddressBook />
      </section>
    </div>
  );
}
