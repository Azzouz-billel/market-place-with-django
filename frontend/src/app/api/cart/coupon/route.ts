import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE, CART_COOKIE, tokenHeader } from "@/lib/cart-server";

export async function POST(request: Request) {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  const body = await request.json();
  const res = await fetch(`${API_BASE}/cart/coupon/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...tokenHeader(token) },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE() {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  const res = await fetch(`${API_BASE}/cart/coupon/`, {
    method: "DELETE",
    headers: tokenHeader(token),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
