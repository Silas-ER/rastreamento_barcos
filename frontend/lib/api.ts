import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError(
      "NEXT_PUBLIC_API_URL não está configurada. Defina a variável de ambiente apontando para o backend.",
      0
    );
  }

  const { auth = true, headers, ...rest } = options;

  const finalHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (auth) {
    const token = getToken();
    if (token) {
      (finalHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
    });
  } catch {
    throw new ApiError(
      "Não foi possível conectar à API. Verifique sua conexão ou tente novamente mais tarde.",
      0
    );
  }

  if (!response.ok) {
    let message = `Erro ${response.status} ao chamar a API.`;
    try {
      const data = await response.json();
      if (data?.detail) {
        message = typeof data.detail === "string" ? data.detail : message;
      }
    } catch {
      // resposta sem corpo JSON
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Barco {
  id: number;
  nome: string;
  mmsi: string;
}

export interface BarcoCreate {
  nome: string;
  mmsi: string;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  cargo: "admin" | "consulta";
}

export interface UsuarioCreate {
  nome: string;
  email: string;
  senha: string;
  cargo: "admin" | "consulta";
}

/**
 * Os endpoints de rastreamento estão sendo desenvolvidos em paralelo no
 * backend, então os nomes exatos de campos podem variar. Os tipos "Raw*"
 * abaixo representam o formato bruto (pouco confiável) retornado pela API,
 * e as funções "parse*" isolam a normalização em um único lugar — ajuste
 * apenas essas funções caso os nomes de campos do backend sejam diferentes.
 */

// ---- Posição atual de um barco (GET /barcos/rastreamento/atual) ----

export interface RawBarcoAtual {
  id?: number;
  barco_id?: number;
  nome?: string;
  mmsi?: string;
  latitude?: number | string;
  lat?: number | string;
  longitude?: number | string;
  lon?: number | string;
  lng?: number | string;
  timestamp?: string;
  data?: string;
  data_hora?: string;
  posicao?: {
    latitude?: number | string;
    lat?: number | string;
    longitude?: number | string;
    lon?: number | string;
    lng?: number | string;
    timestamp?: string;
    data?: string;
    data_hora?: string;
  };
  [key: string]: unknown;
}

export interface BarcoAtual {
  id: number | null;
  nome: string;
  mmsi: string;
  lat: number | null;
  lon: number | null;
  timestamp: string | null;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseBarcoAtual(raw: RawBarcoAtual): BarcoAtual {
  const pos = raw.posicao ?? raw;
  return {
    id: toNumber(raw.id ?? raw.barco_id),
    nome: raw.nome ?? "Desconhecido",
    mmsi: raw.mmsi ?? "-",
    lat: toNumber(pos.latitude ?? pos.lat),
    lon: toNumber(pos.longitude ?? pos.lon ?? pos.lng),
    timestamp: pos.timestamp ?? pos.data ?? pos.data_hora ?? null,
  };
}

// ---- Histórico de trajeto (GET /barcos/{id}/historico?dias=N) ----

export interface RawPontoHistorico {
  latitude?: number | string;
  lat?: number | string;
  longitude?: number | string;
  lon?: number | string;
  lng?: number | string;
  timestamp?: string;
  data?: string;
  data_hora?: string;
  [key: string]: unknown;
}

export interface PontoHistorico {
  lat: number | null;
  lon: number | null;
  timestamp: string | null;
}

export function parsePontoHistorico(raw: RawPontoHistorico): PontoHistorico {
  return {
    lat: toNumber(raw.latitude ?? raw.lat),
    lon: toNumber(raw.longitude ?? raw.lon ?? raw.lng),
    timestamp: raw.timestamp ?? raw.data ?? raw.data_hora ?? null,
  };
}

export type DiasHistorico = 5 | 10 | 15 | 30;

// ---- Pesquisa externa de barcos (GET /barcos/pesquisa) ----

export interface RawResultadoPesquisa {
  id?: number;
  barco_id?: number;
  nome?: string;
  mmsi?: string;
  cadastrado?: boolean;
  ja_cadastrado?: boolean;
  is_cadastrado?: boolean;
  [key: string]: unknown;
}

export interface ResultadoPesquisa {
  id: number | null;
  nome: string;
  mmsi: string;
  cadastrado: boolean | null;
}

export function parseResultadoPesquisa(raw: RawResultadoPesquisa): ResultadoPesquisa {
  const cadastradoRaw = raw.cadastrado ?? raw.ja_cadastrado ?? raw.is_cadastrado;
  return {
    id: toNumber(raw.id ?? raw.barco_id),
    nome: raw.nome ?? "Desconhecido",
    mmsi: raw.mmsi ?? "-",
    cadastrado: typeof cadastradoRaw === "boolean" ? cadastradoRaw : null,
  };
}

export const api = {
  login: (body: LoginRequest) =>
    request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    }),

  listBarcos: () => request<Barco[]>("/barcos/"),

  getBarco: (id: string | number) => request<Barco>(`/barcos/${id}`),

  createBarco: (body: BarcoCreate) =>
    request<Barco>("/barcos/", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listUsuarios: () => request<Usuario[]>("/usuarios/"),

  createUsuario: (body: UsuarioCreate) =>
    request<Usuario>("/usuarios/", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  rastreamentoAtual: () => request<RawBarcoAtual[]>("/barcos/rastreamento/atual"),

  historicoBarco: (id: string | number, dias: DiasHistorico) =>
    request<RawPontoHistorico[]>(`/barcos/${id}/historico?dias=${dias}`),

  pesquisarBarcos: (query: { nome?: string; mmsi?: string }) => {
    const params = new URLSearchParams();
    if (query.nome) params.set("nome", query.nome);
    if (query.mmsi) params.set("mmsi", query.mmsi);
    return request<RawResultadoPesquisa[]>(`/barcos/pesquisa?${params.toString()}`);
  },
};
