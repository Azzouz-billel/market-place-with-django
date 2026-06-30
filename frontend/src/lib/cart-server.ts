import "server-only";

// Shared config for the cart BFF route handlers, which proxy to the Django API
// and manage the httpOnly cart token cookie. The browser never sees the token.
export const CART_COOKIE = "cart_token";
export const API_BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:8000/api";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export function tokenHeader(token: string | undefined): HeadersInit {
  return token ? { "X-Cart-Token": token } : {};
}
