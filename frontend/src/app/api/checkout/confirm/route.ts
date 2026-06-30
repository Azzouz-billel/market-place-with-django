import { NextResponse } from "next/server";

import { API_BASE, CART_COOKIE } from "@/lib/cart-server";

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${API_BASE}/checkout/confirm/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  const response = NextResponse.json(data, { status: res.status });
  // Order paid -> the server-side cart was deleted, so drop the stale token cookie.
  if (res.ok && data.status && data.status !== "pending") {
    response.cookies.delete(CART_COOKIE);
  }
  return response;
}
