import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE, AUTH_COOKIE, authHeader } from "@/lib/auth-server";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const { id } = await params;
  const body = await request.json();
  const res = await fetch(`${API_BASE}/account/addresses/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_request: Request, { params }: Context) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const { id } = await params;
  const res = await fetch(`${API_BASE}/account/addresses/${id}/`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
