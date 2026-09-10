import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/apiAuth";
import { hashSenha } from "@/lib/password";
import { errorResponse, handleApiError } from "@/lib/apiError";
import { Cargo } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  try {
    const usuario = await getCurrentUser(request);
    requireAdmin(usuario);

    const result = await pool.query(
      "SELECT id, nome, email, cargo FROM usuarios ORDER BY id"
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = await getCurrentUser(request);
    requireAdmin(usuario);

    const body = await request.json();
    const { nome, email, senha, cargo } = body as {
      nome: string;
      email: string;
      senha: string;
      cargo?: Cargo;
    };
    const cargoFinal: Cargo = cargo ?? "consulta";

    const existente = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (existente.rows.length > 0) {
      return errorResponse(400, "Email já cadastrado");
    }

    const senhaHash = await hashSenha(senha);
    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, cargo)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, email, cargo`,
      [nome, email, senhaHash, cargoFinal]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
