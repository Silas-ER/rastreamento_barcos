import { NextRequest } from "next/server";
import { pool } from "./db";
import { decodificarToken, Cargo } from "./jwt";
import { ApiHttpError } from "./apiError";

export interface CurrentUser {
  id: number;
  nome: string;
  email: string;
  cargo: Cargo;
}

const CREDENCIAIS_INVALIDAS = new ApiHttpError(401, "Credenciais inválidas");

export async function getCurrentUser(request: NextRequest): Promise<CurrentUser> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw CREDENCIAIS_INVALIDAS;
  }
  const token = authHeader.slice("Bearer ".length);

  const payload = decodificarToken(token);
  if (!payload?.sub) {
    throw CREDENCIAIS_INVALIDAS;
  }

  const result = await pool.query(
    "SELECT id, nome, email, cargo FROM usuarios WHERE email = $1",
    [payload.sub]
  );
  const usuario = result.rows[0];
  if (!usuario) {
    throw CREDENCIAIS_INVALIDAS;
  }

  return usuario as CurrentUser;
}

export function requireAdmin(usuario: CurrentUser): void {
  if (usuario.cargo !== "admin") {
    throw new ApiHttpError(403, "Apenas administradores podem realizar esta ação");
  }
}
