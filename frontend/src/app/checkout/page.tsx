"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";
import type { Address } from "@/types/account";

type FieldConfig = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  hint?: string;
};

const FIELDS: FieldConfig[] = [
  { name: "email", label: "Email", type: "email", required: true },
  { name: "shipping_name", label: "Full name", required: true },
  { name: "shipping_line1", label: "Address line 1", required: true },
  { name: "shipping_line2", label: "Address line 2" },
  { name: "shipping_city", label: "City", required: true },
  { name: "shipping_state", label: "State / Region" },
  { name: "shipping_postal_code", label: "Postal code", required: true },
  { name: "shipping_country", label: "Country", required: true, hint: "2-letter code, e.g. US" },
  { name: "phone", label: "Phone" },
];

const initialForm = Object.fromEntries(FIELDS.map((field) => [field.name, ""])) as Record<string, string>;

export default function CheckoutPage() {
  const { cart, loading } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState<Record<string, string>>({ ...initialForm, shipping_country: "US" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [saveAddress, setSaveAddress] = useState(false);

  // Signed-in shoppers see their account email prefilled until they type their own.
  const emailValue = form.email || user?.email || "";

  useEffect(() => {
    if (!user) {
      return;
    }
    (async () => {
      const res = await fetch("/api/account/addresses");
      if (res.ok) {
        setAddresses(await res.json());
      }
    })();
  }, [user]);

  function applyAddress(address: Address) {
    setForm((current) => ({
      ...current,
      shipping_name: address.full_name,
      shipping_line1: address.line1,
      shipping_line2: address.line2,
      shipping_city: address.city,
      shipping_state: address.state,
      shipping_postal_code: address.postal_code,
      shipping_country: address.country,
      phone: address.phone,
    }));
  }

  if (loading) {
    return <p className="py-16 text-center text-muted">Loading…</p>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Your cart is empty</h1>
        <Link
          href="/products"
          className="rounded-base bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Shop products
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    if (saveAddress && user) {
      await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.shipping_name,
          line1: form.shipping_line1,
          line2: form.shipping_line2,
          city: form.shipping_city,
          state: form.shipping_state,
          postal_code: form.shipping_postal_code,
          country: form.shipping_country,
          phone: form.phone,
        }),
      });
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, email: emailValue }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPending(false);
      setError(data.detail ?? "Could not start checkout. Please try again.");
      return;
    }
    // Redirect to Stripe (real) or straight to the success page (dev bypass).
    window.location.href = data.checkout_url;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>

        {addresses.length > 0 && (
          <div className="flex flex-col gap-1">
            <label htmlFor="saved-address" className="text-sm font-medium">Use a saved address</label>
            <select
              id="saved-address"
              defaultValue=""
              onChange={(event) => {
                const address = addresses.find((item) => item.id === Number(event.target.value));
                if (address) {
                  applyAddress(address);
                }
              }}
              className="rounded-base border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <option value="">Enter a new address</option>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label || address.full_name} — {address.line1}, {address.city}
                </option>
              ))}
            </select>
          </div>
        )}

        <fieldset className="grid gap-4 sm:grid-cols-2" disabled={pending}>
          {FIELDS.map((field) => (
            <div
              key={field.name}
              className={`flex flex-col gap-1 ${field.name === "shipping_line1" || field.name === "shipping_line2" || field.name === "email" ? "sm:col-span-2" : ""}`}
            >
              <label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
                {!field.required && <span className="text-muted"> (optional)</span>}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type ?? "text"}
                required={field.required}
                value={field.name === "email" ? emailValue : form[field.name]}
                maxLength={field.name === "shipping_country" ? 2 : undefined}
                onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
                className="rounded-base border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
              />
              {field.hint && <p className="text-xs text-muted">{field.hint}</p>}
            </div>
          ))}
        </fieldset>

        {user && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={saveAddress}
              onChange={(event) => setSaveAddress(event.target.checked)}
            />
            Save this address to my account
          </label>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-base bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        >
          {pending ? "Starting checkout…" : "Continue to payment"}
        </button>
      </form>

      <aside className="flex h-fit flex-col gap-4 rounded-base border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <ul className="flex flex-col gap-3" role="list">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 text-sm">
              <span>
                {item.quantity} × {item.variant.product_name}
                <span className="text-muted"> ({item.variant.name})</span>
              </span>
              <span className="font-medium">{formatPrice(item.line_total)}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <div className="flex justify-between text-sm text-muted">
            <span>Subtotal</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
          {Number(cart.discount) > 0 && (
            <div className="flex justify-between text-sm text-accent">
              <span>Discount{cart.coupon_code ? ` (${cart.coupon_code})` : ""}</span>
              <span>−{formatPrice(cart.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatPrice(cart.total)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
