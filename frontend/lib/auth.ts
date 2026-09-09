import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "rb_token";

export type Cargo = "admin" | "consulta";

interface TokenClaims {
  sub: string;
  cargo: Cargo;
  exp?: number;
}

export function saveToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function decodeToken(token: string): TokenClaims | null {
  try {
    return jwtDecode<TokenClaims>(token);
  } catch {
    return null;
  }
}

export function getCurrentUser(): TokenClaims | null {
  const token = getToken();
  if (!token) return null;

  const claims = decodeToken(token);
  if (!claims) return null;

  if (claims.exp && Date.now() >= claims.exp * 1000) {
    clearToken();
    return null;
  }

  return claims;
}

export function isAdmin(): boolean {
  return getCurrentUser()?.cargo === "admin";
}
