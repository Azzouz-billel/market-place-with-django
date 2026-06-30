import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE, CART_COOKIE, tokenHeader } from "@/lib/cart-server";

type Context = { params: Promise<{ id: string }> };

async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(CART_COOKIE)?.value;
}

export async function PATCH(request: Request, { params }: Context) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ detail: "No cart." }, { status: 404 });
  }
  const { id } = await params;
  const body = await request.json();
  const res = await fetch(`${API_BASE}/cart/items/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...tokenHeader(token) },
    body: JSON.stringify(body),
  });
  const data = res.status === 404 ? { detail: "Item not found." } : await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_request: Request, { params }: Context) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ detail: "No cart." }, { status: 404 });
  }
  const { id } = await params;
  const res = await fetch(`${API_BASE}/cart/items/${id}/`, {
    method: "DELETE",
    headers: tokenHeader(token),
  });
  const data = res.status === 404 ? { detail: "Item not found." } : await res.json();
  return NextResponse.json(data, { status: res.status });
}
