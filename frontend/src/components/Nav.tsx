import Link from "next/link";
import { Suspense } from "react";

import AuthNav from "./AuthNav";
import CartBadge from "./CartBadge";
import SearchBar from "./SearchBar";

export default function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Lumen
        </Link>
        <div className="order-3 w-full sm:order-2 sm:ml-auto sm:w-auto sm:flex-1 sm:max-w-xs">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>
        <div className="order-2 ml-auto flex items-center gap-1 sm:order-3 sm:ml-0">
          <Link
            href="/products"
            className="rounded-base px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            All products
          </Link>
          <AuthNav />
          <CartBadge />
        </div>
      </nav>
    </header>
  );
}
