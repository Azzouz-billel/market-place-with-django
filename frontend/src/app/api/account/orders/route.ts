import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE, AUTH_COOKIE, authHeader } from "@/lib/auth-server";

export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const res = await fetch(`${API_BASE}/account/orders/`, {
    headers: authHeader(token),
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
