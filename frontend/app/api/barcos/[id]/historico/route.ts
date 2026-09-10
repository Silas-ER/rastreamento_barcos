import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/apiAuth";
import { errorResponse, handleApiError } from "@/lib/apiError";
import { calcularPeriodo, obterHistorico, GFWError } from "@/lib/gfw";

type Params = { params: Promise<{ id: string }> };

const DIAS_VALIDOS = [5, 10, 15, 30];

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await getCurrentUser(request);

    const { id } = await params;
    const diasParam = request.nextUrl.searchParams.get("dias");
    const dias = diasParam ? Number(diasParam) : 5;

    if (!DIAS_VALIDOS.includes(dias)) {
      return errorResponse(
        400,
        `Parâmetro 'dias' deve ser um dos valores: (${DIAS_VALIDOS.join(", ")})`
      );
    }

    const barcoResult = await pool.query("SELECT mmsi FROM barcos WHERE id = $1", [id]);
    if (barcoResult.rows.length === 0) {
      return errorResponse(404, "Barco não encontrado");
    }
    const { mmsi } = barcoResult.rows[0];

    const [dateInit, dateFinal] = calcularPeriodo(dias);

    try {
      const pontos = await obterHistorico(mmsi, dateInit, dateFinal);
      return NextResponse.json(pontos);
    } catch (err) {
      if (err instanceof GFWError) {
        return errorResponse(502, `Falha ao consultar a API externa: ${err.message}`);
      }
      throw err;
    }
  } catch (err) {
    return handleApiError(err);
  }
}
