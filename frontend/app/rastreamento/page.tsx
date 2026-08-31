"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, BarcoAtual, parseBarcoAtual } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import BarcosMap, { MapMarker } from "@/app/components/BarcosMapClient";

export default function RastreamentoPage() {
  const router = useRouter();
  const [barcos, setBarcos] = useState<BarcoAtual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .rastreamentoAtual()
      .then((raw) => setBarcos(raw.map(parseBarcoAtual)))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Erro ao carregar posições dos barcos.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    carregar();
  }, [router, carregar]);

  const markers: MapMarker[] = barcos
    .filter((b) => b.lat !== null && b.lon !== null)
    .map((b) => ({
      id: b.id ?? b.mmsi,
      lat: b.lat as number,
      lon: b.lon as number,
      label: `${b.nome} (${b.mmsi})`,
    }));

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-foreground">Localização atual</h1>
          <p className="text-sm text-muted">
            Posição mais recente de cada embarcação cadastrada.
          </p>
        </div>
        <button
          onClick={carregar}
          disabled={loading}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {error && (
        <p className="mb-6 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading && barcos.length === 0 && !error && (
        <p className="mb-6 text-sm text-muted">Carregando posições...</p>
      )}

      {!loading && !error && barcos.length === 0 && (
        <p className="mb-6 text-sm text-muted">Nenhum barco cadastrado.</p>
      )}

      {!error && barcos.length > 0 && (
        <div className="mb-8">
          <BarcosMap markers={markers} />
        </div>
      )}

      {!loading && !error && barcos.length > 0 && (
        <div className="rounded-lg border border-border bg-background-elevated">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-medium text-foreground">Embarcações</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">MMSI</th>
                <th className="px-5 py-3 font-medium">Latitude</th>
                <th className="px-5 py-3 font-medium">Longitude</th>
                <th className="px-5 py-3 font-medium">Última atualização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {barcos.map((barco, idx) => (
                <tr key={barco.id ?? idx} className="hover:bg-background/60">
                  <td className="px-5 py-3 text-foreground">{barco.nome}</td>
                  <td className="px-5 py-3 text-muted">{barco.mmsi}</td>
                  <td className="px-5 py-3 text-muted">{barco.lat ?? "-"}</td>
                  <td className="px-5 py-3 text-muted">{barco.lon ?? "-"}</td>
                  <td className="px-5 py-3 text-muted">{barco.timestamp ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
