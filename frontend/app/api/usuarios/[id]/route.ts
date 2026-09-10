import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/apiAuth";
import { hashSenha } from "@/lib/password";
import { errorResponse, handleApiError } from "@/lib/apiError";
import { Cargo } from "@/lib/jwt";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const usuario = await getCurrentUser(request);
    requireAdmin(usuario);

    const { id } = await params;
    const result = await pool.query(
      "SELECT id, nome, email, cargo FROM usuarios WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return errorResponse(404, "Usuário não encontrado");
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const usuario = await getCurrentUser(request);
    requireAdmin(usuario);

    const { id } = await params;
    const existente = await pool.query("SELECT * FROM usuarios WHERE id = $1", [id]);
    if (existente.rows.length === 0) {
      return errorResponse(404, "Usuário não encontrado");
    }
    const atual = existente.rows[0];

    const body = await request.json();
    const { nome, email, senha, cargo } = body as {
      nome?: string;
      email?: string;
      senha?: string;
      cargo?: Cargo;
    };

    const novoNome = nome ?? atual.nome;
    const novoEmail = email ?? atual.email;
    const novoCargo = cargo ?? atual.cargo;
    const novaSenhaHash = senha ? await hashSenha(senha) : atual.senha_hash;

    const result = await pool.query(
      `UPDATE usuarios SET nome = $1, email = $2, cargo = $3, senha_hash = $4
       WHERE id = $5
       RETURNING id, nome, email, cargo`,
      [novoNome, novoEmail, novoCargo, novaSenhaHash, id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const usuario = await getCurrentUser(request);
    requireAdmin(usuario);

    const { id } = await params;
    const result = await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return errorResponse(404, "Usuário não encontrado");
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
