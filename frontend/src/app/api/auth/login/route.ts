import { NextResponse } from "next/server";

import { API_BASE, AUTH_COOKIE, COOKIE_OPTIONS } from "@/lib/auth-server";

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  // Keep the token server-side only; hand the client just the user.
  const response = NextResponse.json({ user: data.user });
  response.cookies.set(AUTH_COOKIE, data.token, COOKIE_OPTIONS);
  return response;
}
