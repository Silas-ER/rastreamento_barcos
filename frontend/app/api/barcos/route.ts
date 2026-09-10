import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/apiAuth";
import { errorResponse, handleApiError } from "@/lib/apiError";

export async function GET(request: NextRequest) {
  try {
    await getCurrentUser(request);

    const result = await pool.query("SELECT id, nome, mmsi FROM barcos ORDER BY id");
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
    const { nome, mmsi } = body as { nome: string; mmsi: string };

    const existente = await pool.query("SELECT id FROM barcos WHERE mmsi = $1", [mmsi]);
    if (existente.rows.length > 0) {
      return errorResponse(400, "MMSI já cadastrado");
    }

    const result = await pool.query(
      "INSERT INTO barcos (nome, mmsi) VALUES ($1, $2) RETURNING id, nome, mmsi",
      [nome, mmsi]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
