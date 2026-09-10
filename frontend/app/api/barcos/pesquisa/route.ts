import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/apiAuth";
import { errorResponse, handleApiError } from "@/lib/apiError";
import { buscar, GFWError } from "@/lib/gfw";

export async function GET(request: NextRequest) {
  try {
    await getCurrentUser(request);

    const searchParams = request.nextUrl.searchParams;
    const nome = searchParams.get("nome") || undefined;
    const mmsi = searchParams.get("mmsi") || undefined;

    if (!nome && !mmsi) {
      return errorResponse(400, "Informe ao menos um dos parâmetros: nome ou mmsi");
    }

    let itens;
    try {
      itens = await buscar(nome, mmsi);
    } catch (err) {
      if (err instanceof GFWError) {
        return errorResponse(502, `Falha ao consultar a API externa: ${err.message}`);
      }
      throw err;
    }

    const barcosResult = await pool.query("SELECT id, mmsi FROM barcos");
    const mapaMmsi = new Map<string, number>(
      barcosResult.rows.map((b: { id: number; mmsi: string }) => [b.mmsi, b.id])
    );

    const resultado = itens.map((item) => {
      const mmsiItem = String(item.mmsi ?? "");
      return {
        id: mapaMmsi.get(mmsiItem) ?? null,
        nome: item.nome || "Desconhecido",
        mmsi: mmsiItem,
        cadastrado: mapaMmsi.has(mmsiItem),
        vigente: item.vigente ?? true,
      };
    });

    return NextResponse.json(resultado);
  } catch (err) {
    return handleApiError(err);
  }
}
