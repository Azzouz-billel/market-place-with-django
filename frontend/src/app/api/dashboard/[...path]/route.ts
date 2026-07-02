import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE, AUTH_COOKIE, authHeader } from "@/lib/auth-server";

type Context = { params: Promise<{ path: string[] }> };

// Staff-only proxy: forwards /api/dashboard/* to Django with the auth token.
// Django's IsAdminUser does the actual gatekeeping (401 anon, 403 non-staff).
async function forward(request: Request, context: Context, method: "GET" | "PATCH") {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const { path } = await context.params;
  const search = new URL(request.url).search;
  const init: RequestInit = {
    method,
    headers: { ...authHeader(token) },
    cache: "no-store",
  };
  if (method === "PATCH") {
    init.headers = { ...init.headers, "Content-Type": "application/json" };
    init.body = JSON.stringify(await request.json());
  }
  const res = await fetch(`${API_BASE}/dashboard/${path.join("/")}/${search}`, init);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(request: Request, context: Context) {
  return forward(request, context, "GET");
}

export async function PATCH(request: Request, context: Context) {
  return forward(request, context, "PATCH");
}
