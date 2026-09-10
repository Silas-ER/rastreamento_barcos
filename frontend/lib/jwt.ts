import jwt from "jsonwebtoken";

export type Cargo = "admin" | "consulta";

export interface TokenPayload {
  sub: string;
  cargo: Cargo;
  exp: number;
}

function getSecretKey(): string {
  const secret = process.env.SECRET_KEY;
  if (!secret) {
    throw new Error("SECRET_KEY não está configurada.");
  }
  return secret;
}

export function criarAccessToken(email: string, cargo: Cargo): string {
  const expireMinutes = Number(process.env.ACCESS_TOKEN_EXPIRE_MINUTES ?? "480");
  return jwt.sign({ sub: email, cargo }, getSecretKey(), {
    algorithm: "HS256",
    expiresIn: expireMinutes * 60,
  });
}

export function decodificarToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getSecretKey(), { algorithms: ["HS256"] }) as TokenPayload;
  } catch {
    return null;
  }
}
