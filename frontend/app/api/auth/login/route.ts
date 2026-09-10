import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verificarSenha } from "@/lib/password";
import { criarAccessToken, Cargo } from "@/lib/jwt";
import { errorResponse, handleApiError } from "@/lib/apiError";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, senha } = body as { email?: string; senha?: string };

    if (!email || !senha) {
      return errorResponse(422, "Email e senha são obrigatórios");
    }

    const result = await pool.query(
      "SELECT id, senha_hash, cargo FROM usuarios WHERE email = $1",
      [email]
    );
    const usuario = result.rows[0];

    if (!usuario || !(await verificarSenha(senha, usuario.senha_hash))) {
      return errorResponse(401, "Email ou senha inválidos");
    }

    const accessToken = criarAccessToken(email, usuario.cargo as Cargo);
    return NextResponse.json({ access_token: accessToken, token_type: "bearer" });
  } catch (err) {
    return handleApiError(err);
  }
}
