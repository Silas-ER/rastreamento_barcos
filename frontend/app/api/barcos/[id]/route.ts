import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/apiAuth";
import { errorResponse, handleApiError } from "@/lib/apiError";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await getCurrentUser(request);

    const { id } = await params;
    const result = await pool.query("SELECT id, nome, mmsi FROM barcos WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return errorResponse(404, "Barco não encontrado");
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
    const existente = await pool.query("SELECT * FROM barcos WHERE id = $1", [id]);
    if (existente.rows.length === 0) {
      return errorResponse(404, "Barco não encontrado");
    }
    const atual = existente.rows[0];

    const body = await request.json();
    const { nome, mmsi } = body as { nome?: string; mmsi?: string };

    const novoNome = nome ?? atual.nome;
    const novoMmsi = mmsi ?? atual.mmsi;

    const result = await pool.query(
      "UPDATE barcos SET nome = $1, mmsi = $2 WHERE id = $3 RETURNING id, nome, mmsi",
      [novoNome, novoMmsi, id]
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
    const result = await pool.query("DELETE FROM barcos WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return errorResponse(404, "Barco não encontrado");
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
