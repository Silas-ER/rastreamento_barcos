"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, BarcoAtual, parseBarcoAtual } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import BarcosMap, { MapMarker } from "@/app/components/BarcosMapClient";
import MapaLegenda from "@/app/components/MapaLegenda";

export default function RastreamentoPage() {
  const router = useRouter();
  const [barcos, setBarcos] = useState<BarcoAtual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecionadoId, setSelecionadoId] = useState<string | number | null>(null);

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
      nome: b.nome,
      atualizadoEm: b.timestamp,
    }));

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
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
        <div className="relative">
          <BarcosMap
            markers={markers}
            height="calc(100vh - 8rem)"
            selecionadoId={selecionadoId}
            onPopupClose={() => setSelecionadoId(null)}
          />
          {markers.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 z-[1000] border-t border-border bg-background-elevated/95 px-3 py-2 backdrop-blur">
              <MapaLegenda
                markers={markers}
                selecionadoId={selecionadoId}
                onSelect={(id) => setSelecionadoId(id)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
