"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/AuthProvider";
import ProductGrid from "@/components/ProductGrid";
import { useWishlist } from "@/components/WishlistProvider";

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { products, loading } = useWishlist();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user || loading) {
    return <p className="py-16 text-center text-muted">Loading…</p>;
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Your wishlist is empty</h1>
        <p className="text-muted">Tap the heart on any product to save it here.</p>
        <Link
          href="/products"
          className="rounded-base bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold tracking-tight">Your wishlist</h1>
      <ProductGrid products={products} />
    </div>
  );
}
