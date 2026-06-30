import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE, CART_COOKIE, COOKIE_OPTIONS, tokenHeader } from "@/lib/cart-server";

export async function POST(request: Request) {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  const body = await request.json();

  const res = await fetch(`${API_BASE}/cart/items/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...tokenHeader(token) },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  const response = NextResponse.json(data, { status: res.status });
  // Django mints the cart on first add; persist its token for subsequent requests.
  if (res.ok && data.token && data.token !== token) {
    response.cookies.set(CART_COOKIE, data.token, COOKIE_OPTIONS);
  }
  return response;
}
