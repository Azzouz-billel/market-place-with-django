import "server-only";

import { API_BASE, COOKIE_OPTIONS } from "./cart-server";

export const AUTH_COOKIE = "auth_token";
export { API_BASE, COOKIE_OPTIONS };

export function authHeader(token: string | undefined): HeadersInit {
  return token ? { Authorization: `Token ${token}` } : {};
}
