import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/apiAuth";
import { handleApiError } from "@/lib/apiError";
import { obterStatusAtual, mapWithConcurrency, GFWError } from "@/lib/gfw";

export async function GET(request: NextRequest) {
  try {
    await getCurrentUser(request);

    const result = await pool.query("SELECT id, nome, mmsi FROM barcos ORDER BY id");
    const barcos = result.rows as { id: number; nome: string; mmsi: string }[];

    const respostas = await mapWithConcurrency(barcos, 8, async (barco) => {
      try {
        const posicao = await obterStatusAtual(barco.mmsi);
        return {
          id: barco.id,
          nome: barco.nome,
          mmsi: barco.mmsi,
          lat: posicao?.lat ?? null,
          lon: posicao?.lon ?? null,
          timestamp: posicao?.timestamp ?? null,
        };
      } catch (err) {
        if (err instanceof GFWError) {
          console.warn(`Falha ao obter status atual do barco ${barco.mmsi}: ${err.message}`);
          return { id: barco.id, nome: barco.nome, mmsi: barco.mmsi, lat: null, lon: null, timestamp: null };
        }
        throw err;
      }
    });

    return NextResponse.json(respostas);
  } catch (err) {
    return handleApiError(err);
  }
}
