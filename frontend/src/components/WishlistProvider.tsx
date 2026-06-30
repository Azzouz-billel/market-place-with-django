"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import type { ProductListItem } from "@/types/catalog";

interface WishlistContextValue {
  products: ProductListItem[];
  loading: boolean;
  isWished: (slug: string) => boolean;
  toggle: (slug: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}

export default function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) {
        setProducts([]);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/account/wishlist");
        setProducts(res.ok ? await res.json() : []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const isWished = useCallback(
    (slug: string) => products.some((product) => product.slug === slug),
    [products],
  );

  const toggle = useCallback(
    async (slug: string) => {
      const wished = products.some((product) => product.slug === slug);
      const res = wished
        ? await fetch(`/api/account/wishlist/${slug}`, { method: "DELETE" })
        : await fetch("/api/account/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
          });
      if (res.ok) {
        setProducts(await res.json());
      }
    },
    [products],
  );

  return (
    <WishlistContext.Provider value={{ products, loading, isWished, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}
