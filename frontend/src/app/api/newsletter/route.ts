import { NextResponse } from "next/server";

import { API_BASE } from "@/lib/cart-server";

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${API_BASE}/newsletter/subscribe/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
