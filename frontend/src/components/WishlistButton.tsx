"use client";

import Link from "next/link";

import { useAuth } from "@/components/AuthProvider";
import { useWishlist } from "@/components/WishlistProvider";

export default function WishlistButton({ slug, className = "" }: { slug: string; className?: string }) {
  const { user } = useAuth();
  const { isWished, toggle } = useWishlist();

  const base =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

  if (!user) {
    return (
      <Link href="/login" aria-label="Sign in to save to wishlist" className={`${base} ${className}`}>
        <span aria-hidden="true" className="text-muted">♡</span>
      </Link>
    );
  }

  const wished = isWished(slug);
  return (
    <button
      type="button"
      aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wished}
      onClick={(event) => {
        event.preventDefault();
        toggle(slug);
      }}
      className={`${base} ${className}`}
    >
      <span aria-hidden="true" className={wished ? "text-accent" : "text-muted"}>
        {wished ? "♥" : "♡"}
      </span>
    </button>
  );
}
