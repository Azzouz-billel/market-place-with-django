import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE, CART_COOKIE, tokenHeader } from "@/lib/cart-server";

export async function GET() {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  const res = await fetch(`${API_BASE}/cart/`, {
    headers: tokenHeader(token),
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
