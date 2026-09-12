"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  api,
  ApiError,
  Barco,
  DiasHistorico,
  PontoHistorico,
  parsePontoHistorico,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import BarcosMap, { MapMarker } from "@/app/components/BarcosMapClient";

const OPCOES_DIAS: DiasHistorico[] = [5, 10, 15, 30];

export default function HistoricoPage() {
  const router = useRouter();
  const [barcos, setBarcos] = useState<Barco[]>([]);
  const [barcoId, setBarcoId] = useState<string>("");
  const [dias, setDias] = useState<DiasHistorico>(5);
  const [pontos, setPontos] = useState<PontoHistorico[]>([]);
  const [loadingBarcos, setLoadingBarcos] = useState(true);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buscou, setBuscou] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    api
      .listBarcos()
      .then(setBarcos)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Erro ao carregar embarcações.");
      })
      .finally(() => setLoadingBarcos(false));
  }, [router]);

  function handleBuscar() {
    if (!barcoId) return;
    setLoadingHistorico(true);
    setError(null);
    setBuscou(true);

    api
      .historicoBarco(barcoId, dias)
      .then((raw) => setPontos(raw.map(parsePontoHistorico)))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Erro ao carregar histórico.");
      })
      .finally(() => setLoadingHistorico(false));
  }

  const pontosValidos = pontos.filter((p) => p.lat !== null && p.lon !== null);
  const markers: MapMarker[] = pontosValidos.map((p, idx) => ({
    id: `${p.timestamp ?? idx}-${idx}`,
    lat: p.lat as number,
    lon: p.lon as number,
    label: p.timestamp ?? `Ponto ${idx + 1}`,
    color: "#2dd4bf",
  }));
  const polyline: [number, number][] = pontosValidos.map((p) => [p.lat as number, p.lon as number]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <h1 className="mb-1 text-2xl font-semibold text-foreground">Histórico de trajeto</h1>
      <p className="mb-8 text-sm text-muted">
        Selecione uma embarcação e um período para visualizar o trajeto percorrido.
      </p>

      <div className="mb-8 flex flex-col gap-4 rounded-lg border border-border bg-background-elevated p-4 sm:flex-row sm:flex-wrap sm:items-end sm:p-5">
        <div className="w-full sm:min-w-[220px] sm:w-auto">
          <label htmlFor="barco" className="mb-1 block text-sm text-muted">
            Embarcação
          </label>
          <select
            id="barco"
            value={barcoId}
            onChange={(e) => setBarcoId(e.target.value)}
            disabled={loadingBarcos}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-accent focus:outline-none"
          >
            <option value="">Selecione...</option>
            {barcos.map((barco) => (
              <option key={barco.id} value={barco.id}>
                {barco.nome} ({barco.mmsi})
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:min-w-[140px] sm:w-auto">
          <label htmlFor="dias" className="mb-1 block text-sm text-muted">
            Período
          </label>
          <select
            id="dias"
            value={dias}
            onChange={(e) => setDias(Number(e.target.value) as DiasHistorico)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-accent focus:outline-none"
          >
            {OPCOES_DIAS.map((d) => (
              <option key={d} value={d}>
                Últimos {d} dias
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleBuscar}
          disabled={!barcoId || loadingHistorico}
          className="w-full rounded-md bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60 sm:w-auto"
        >
          {loadingHistorico ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {error && (
        <p className="mb-6 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {!error && buscou && !loadingHistorico && pontos.length === 0 && (
        <p className="mb-6 text-sm text-muted">
          Nenhum ponto de trajeto encontrado para o período selecionado.
        </p>
      )}

      {!error && pontosValidos.length > 0 && (
        <div className="mb-8">
          <BarcosMap markers={markers} polyline={polyline} />
        </div>
      )}

      {!error && !loadingHistorico && pontos.length > 0 && (
        <div className="rounded-lg border border-border bg-background-elevated">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-medium text-foreground">Pontos do trajeto</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-5 py-3 font-medium">Data/Hora</th>
                  <th className="px-5 py-3 font-medium">Latitude</th>
                  <th className="px-5 py-3 font-medium">Longitude</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pontos.map((ponto, idx) => (
                  <tr key={idx} className="hover:bg-background/60">
                    <td className="px-5 py-3 text-foreground">{ponto.timestamp ?? "-"}</td>
                    <td className="px-5 py-3 text-muted">{ponto.lat ?? "-"}</td>
                    <td className="px-5 py-3 text-muted">{ponto.lon ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
