"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "./AuthProvider";

export default function AuthNav() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-base px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        Sign in
      </Link>
    );
  }

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      {user.is_staff && (
        <Link
          href="/dashboard"
          className="rounded-base px-3 py-2 text-sm font-medium text-accent transition-colors hover:opacity-80"
        >
          Dashboard
        </Link>
      )}
      <Link
        href="/wishlist"
        className="rounded-base px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        Wishlist
      </Link>
      <Link
        href="/account"
        className="rounded-base px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        Account
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-base px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
}
