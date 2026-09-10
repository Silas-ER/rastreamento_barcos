const BASE_URL = "https://gateway.api.globalfishingwatch.org/v3";
const TIMEOUT_MS = 8000;

const VESSEL_IDENTITY_DATASET = "public-global-vessel-identity:latest";
const EVENT_DATASETS = [
  "public-global-fishing-events:latest",
  "public-global-encounters-events:latest",
  "public-global-loitering-events:latest",
  "public-global-gaps-events:latest",
  "public-global-port-visits-events:latest",
];

export class GFWError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonObject = Record<string, any>;

function apiKey(): string {
  return (process.env.API_KEY_GFW ?? "").trim();
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new GFWError("Tempo limite excedido ao consultar a API do GFW");
    }
    throw new GFWError(`Falha ao consultar a API do GFW: ${err}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function parseJsonOrThrow(response: Response): Promise<JsonObject> {
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new GFWError(`GFW retornou erro ${response.status}: ${text}`);
  }
  try {
    return await response.json();
  } catch {
    throw new GFWError("Resposta inválida (não-JSON) da API do GFW");
  }
}

async function get(path: string, params: Record<string, string | number>): Promise<JsonObject> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  const response = await fetchWithTimeout(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  return parseJsonOrThrow(response);
}

async function post(
  path: string,
  params: Record<string, string | number>,
  body: JsonObject
): Promise<JsonObject> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  const response = await fetchWithTimeout(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return parseJsonOrThrow(response);
}

export function calcularPeriodo(dias: number): [string, string] {
  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - dias);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  return [toISODate(inicio), toISODate(hoje)];
}

async function buscarEntradas(query: string, limit = 10): Promise<JsonObject[]> {
  const payload = await get("/vessels/search", {
    query,
    "datasets[0]": VESSEL_IDENTITY_DATASET,
    limit,
  });
  return payload.entries ?? [];
}

function parseTransmissionDateTo(info: JsonObject): number {
  const valor = info.transmissionDateTo;
  if (!valor) return -Infinity;
  const parsed = Date.parse(String(valor));
  return Number.isNaN(parsed) ? -Infinity : parsed;
}

function selfReportedInfosDoMmsi(mmsi: string, entradas: JsonObject[]): JsonObject[] {
  const infos: JsonObject[] = [];
  for (const entrada of entradas) {
    for (const info of entrada.selfReportedInfo ?? []) {
      if (String(info.ssvid ?? "") === String(mmsi)) {
        infos.push(info);
      }
    }
  }
  return infos;
}

export async function resolverVesselId(mmsi: string): Promise<string | null> {
  const entradas = await buscarEntradas(mmsi, 10);
  const infos = selfReportedInfosDoMmsi(mmsi, entradas);
  if (infos.length === 0) return null;
  const maisRecente = infos.reduce((a, b) =>
    parseTransmissionDateTo(a) >= parseTransmissionDateTo(b) ? a : b
  );
  return maisRecente.id ?? null;
}

async function eventos(
  vesselId: string,
  dateInit: string,
  dateFinal: string,
  limit: number,
  sort: string
): Promise<JsonObject[]> {
  const body = {
    datasets: EVENT_DATASETS,
    vessels: [vesselId],
    startDate: dateInit,
    endDate: dateFinal,
  };
  const payload = await post("/events", { limit, offset: 0, sort }, body);
  return payload.entries ?? [];
}

export interface PontoNormalizado {
  lat: number | null;
  lon: number | null;
  timestamp: string | null;
}

function normalizarEvento(evento: JsonObject): PontoNormalizado {
  const posicao = evento.position ?? {};
  return {
    lat: posicao.lat ?? null,
    lon: posicao.lon ?? null,
    timestamp: evento.start ?? null,
  };
}

export async function obterStatusAtual(
  mmsi: string,
  janelaDias = 90
): Promise<PontoNormalizado | null> {
  const vesselId = await resolverVesselId(mmsi);
  if (!vesselId) return null;

  const [dateInit, dateFinal] = calcularPeriodo(janelaDias);
  const lista = await eventos(vesselId, dateInit, dateFinal, 1, "-start");
  if (lista.length === 0) return null;

  return normalizarEvento(lista[0]);
}

export async function obterHistorico(
  mmsi: string,
  dateInit: string,
  dateFinal: string
): Promise<PontoNormalizado[]> {
  const vesselId = await resolverVesselId(mmsi);
  if (!vesselId) return [];

  const lista = await eventos(vesselId, dateInit, dateFinal, 1000, "+start");
  return lista.map(normalizarEvento);
}

export interface ResultadoBusca {
  mmsi: string;
  nome: string;
  vigente: boolean;
}

export async function buscar(nome?: string, mmsi?: string): Promise<ResultadoBusca[]> {
  const query = mmsi || nome || "";
  const entradas = await buscarEntradas(query, 25);

  const infosPorEntrada: JsonObject[] = [];
  for (const entrada of entradas) {
    const infos = entrada.selfReportedInfo ?? [];
    if (infos.length > 0) {
      infosPorEntrada.push(infos[0]);
    }
  }

  infosPorEntrada.sort((a, b) => parseTransmissionDateTo(b) - parseTransmissionDateTo(a));

  const mmsisJaVistos = new Set<string>();
  const resultado: ResultadoBusca[] = [];
  for (const info of infosPorEntrada) {
    const itemMmsi = String(info.ssvid ?? "");
    const vigente = !mmsisJaVistos.has(itemMmsi);
    mmsisJaVistos.add(itemMmsi);
    resultado.push({
      mmsi: itemMmsi,
      nome: info.shipname || "Desconhecido",
      vigente,
    });
  }
  return resultado;
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
