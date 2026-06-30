import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE, AUTH_COOKIE, authHeader } from "@/lib/auth-server";

export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const res = await fetch(`${API_BASE}/account/wishlist/`, {
    headers: authHeader(token),
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const body = await request.json();
  const res = await fetch(`${API_BASE}/account/wishlist/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
