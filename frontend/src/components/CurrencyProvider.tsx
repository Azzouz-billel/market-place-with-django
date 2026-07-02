"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import type { Currency } from "@/types/currency";

const COOKIE = "currency";

interface CurrencyContextValue {
  currencies: Currency[];
  selected: Currency | null;
  setCurrency: (code: string) => void;
  /** Format a base-USD decimal string in the selected currency. */
  format: (amountUsd: string) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

function readCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
  return match ? match[1] : null;
}

export default function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/currencies");
        const list: Currency[] = res.ok ? await res.json() : [];
        setCurrencies(list);
        const preferred = readCookie();
        const fallback = list.find((c) => c.is_default)?.code ?? list[0]?.code ?? null;
        setCode(preferred && list.some((c) => c.code === preferred) ? preferred : fallback);
      } catch {
        setCurrencies([]);
      }
    })();
  }, []);

  const selected = currencies.find((c) => c.code === code) ?? null;

  const setCurrency = useCallback((next: string) => {
    setCode(next);
    document.cookie = `${COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
  }, []);

  const format = useCallback(
    (amountUsd: string) => {
      const amount = Number(amountUsd);
      if (!selected) {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
      }
      const converted = (amount * Number(selected.rate)).toFixed(2);
      return `${selected.symbol}${converted}`;
    },
    [selected],
  );

  return (
    <CurrencyContext.Provider value={{ currencies, selected, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}
