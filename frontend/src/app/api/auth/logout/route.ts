import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE, AUTH_COOKIE, authHeader } from "@/lib/auth-server";

export async function POST() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (token) {
    await fetch(`${API_BASE}/auth/logout/`, {
      method: "POST",
      headers: authHeader(token),
    });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
