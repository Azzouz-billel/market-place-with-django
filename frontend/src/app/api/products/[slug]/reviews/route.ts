import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE, AUTH_COOKIE, authHeader } from "@/lib/auth-server";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { slug } = await params;
  const res = await fetch(`${API_BASE}/products/${slug}/reviews/`, { cache: "no-store" });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request, { params }: Context) {
  const { slug } = await params;
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const body = await request.json();
  const res = await fetch(`${API_BASE}/products/${slug}/reviews/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
