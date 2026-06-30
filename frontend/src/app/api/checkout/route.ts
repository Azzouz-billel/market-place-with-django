import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authHeader, AUTH_COOKIE } from "@/lib/auth-server";
import { API_BASE, CART_COOKIE, tokenHeader } from "@/lib/cart-server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const cartToken = cookieStore.get(CART_COOKIE)?.value;
  const authToken = cookieStore.get(AUTH_COOKIE)?.value;
  const body = await request.json();

  const res = await fetch(`${API_BASE}/checkout/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...tokenHeader(cartToken),
      ...authHeader(authToken),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
