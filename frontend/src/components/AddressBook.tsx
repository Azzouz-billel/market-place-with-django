"use client";

import { useEffect, useState } from "react";

import type { Address, AddressInput } from "@/types/account";

const EMPTY: AddressInput = {
  label: "",
  full_name: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "US",
  phone: "",
  is_default: false,
};

const FIELDS: { name: keyof AddressInput; label: string; required?: boolean }[] = [
  { name: "label", label: "Label (e.g. Home)" },
  { name: "full_name", label: "Full name", required: true },
  { name: "line1", label: "Address line 1", required: true },
  { name: "line2", label: "Address line 2" },
  { name: "city", label: "City", required: true },
  { name: "state", label: "State / Region" },
  { name: "postal_code", label: "Postal code", required: true },
  { name: "country", label: "Country (2-letter)", required: true },
  { name: "phone", label: "Phone" },
];

const inputClass =
  "rounded-base border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40";

export default function AddressBook() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/account/addresses");
      setAddresses(res.ok ? await res.json() : []);
    } catch {
      setAddresses([]);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/account/addresses");
        setAddresses(res.ok ? await res.json() : []);
      } catch {
        setAddresses([]);
      }
    })();
  }, []);

  function startAdd() {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(address: Address) {
    const { id, ...rest } = address;
    void id;
    setForm(rest);
    setEditingId(address.id);
    setShowForm(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = editingId ? `/api/account/addresses/${editingId}` : "/api/account/addresses";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      await load();
    }
  }

  async function remove(id: number) {
    const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    if (res.ok) {
      await load();
    }
  }

  async function makeDefault(id: number) {
    const res = await fetch(`/api/account/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_default: true }),
    });
    if (res.ok) {
      await load();
    }
  }

  if (addresses === null) {
    return <p className="text-muted">Loading addresses…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 && !showForm && (
        <p className="text-muted">No saved addresses yet.</p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2" role="list">
        {addresses.map((address) => (
          <li key={address.id} className="flex flex-col gap-1 rounded-base border border-border bg-card p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{address.label || address.full_name}</span>
              {address.is_default && (
                <span className="rounded-base bg-accent/10 px-2 py-0.5 text-xs text-accent">Default</span>
              )}
            </div>
            <span className="text-muted">{address.full_name}</span>
            <span className="text-muted">{address.line1}</span>
            {address.line2 && <span className="text-muted">{address.line2}</span>}
            <span className="text-muted">
              {address.city}
              {address.state && `, ${address.state}`} {address.postal_code}
            </span>
            <span className="text-muted">{address.country}</span>
            <div className="mt-2 flex gap-3 text-sm">
              <button type="button" onClick={() => startEdit(address)} className="text-accent hover:underline">
                Edit
              </button>
              {!address.is_default && (
                <button type="button" onClick={() => makeDefault(address.id)} className="text-muted hover:text-foreground">
                  Set default
                </button>
              )}
              <button type="button" onClick={() => remove(address.id)} className="text-muted hover:text-foreground">
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {showForm ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-base border border-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <div key={field.name} className="flex flex-col gap-1">
                <label htmlFor={`addr-${field.name}`} className="text-xs font-medium text-muted">
                  {field.label}
                </label>
                <input
                  id={`addr-${field.name}`}
                  required={field.required}
                  maxLength={field.name === "country" ? 2 : undefined}
                  value={form[field.name] as string}
                  onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(event) => setForm({ ...form, is_default: event.target.checked })}
            />
            Set as default
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-base bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Save address
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-base border border-border px-4 py-2 text-sm hover:border-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={startAdd}
          className="self-start rounded-base border border-border px-4 py-2 text-sm font-medium hover:border-accent"
        >
          Add address
        </button>
      )}
    </div>
  );
}
