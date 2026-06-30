import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE, AUTH_COOKIE, authHeader } from "@/lib/auth-server";

type Context = { params: Promise<{ slug: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const { slug } = await params;
  const res = await fetch(`${API_BASE}/account/wishlist/${slug}/`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
