"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZE = 12;

export default function Pagination({ count, page }: { count: number; page: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  if (totalPages <= 1) {
    return null;
  }

  function goToPage(target: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(target));
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  const buttonClass =
    "rounded-base border border-border px-4 py-2 text-sm font-medium transition-colors enabled:hover:border-accent disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav className="flex items-center justify-center gap-4 py-8" aria-label="Pagination">
      <button className={buttonClass} onClick={() => goToPage(page - 1)} disabled={page <= 1}>
        Previous
      </button>
      <span className="text-sm text-muted" aria-current="page">
        Page {page} of {totalPages}
      </span>
      <button
        className={buttonClass}
        onClick={() => goToPage(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </nav>
  );
}
