"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { Cart } from "@/types/cart";

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  totalQuantity: number;
  addItem: (variantId: number, quantity: number) => Promise<{ ok: boolean; error?: string }>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ ok: boolean; error?: string }>;
  removeCoupon: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      setCart(await res.json());
    } catch {
      setCart(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const addItem = useCallback(async (variantId: number, quantity: number) => {
    const res = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variant_id: variantId, quantity }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.detail ?? "Could not add to cart." };
    }
    setCart(data);
    return { ok: true };
  }, []);

  const updateItem = useCallback(async (itemId: number, quantity: number) => {
    const res = await fetch(`/api/cart/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    if (res.ok) {
      setCart(await res.json());
    }
  }, []);

  const removeItem = useCallback(async (itemId: number) => {
    const res = await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      setCart(await res.json());
    }
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    const res = await fetch("/api/cart/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.detail ?? "Could not apply coupon." };
    }
    setCart(data);
    return { ok: true };
  }, []);

  const removeCoupon = useCallback(async () => {
    const res = await fetch("/api/cart/coupon", { method: "DELETE" });
    if (res.ok) {
      setCart(await res.json());
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        totalQuantity: cart?.total_quantity ?? 0,
        addItem,
        updateItem,
        removeItem,
        applyCoupon,
        removeCoupon,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
