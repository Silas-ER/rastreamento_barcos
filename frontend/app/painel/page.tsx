"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError, Barco } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [barcos, setBarcos] = useState<Barco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(err instanceof ApiError ? err.message : "Erro ao carregar barcos.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <h1 className="mb-1 text-2xl font-semibold text-foreground">Painel</h1>
      <p className="mb-8 text-sm text-muted">
        Visão geral das embarcações cadastradas.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Embarcações cadastradas" value={barcos.length} />
        <KpiCard label="Mapa em tempo real" value="Em breve" muted />
        <KpiCard label="Alertas" value="Em breve" muted />
        <KpiCard label="Relatórios" value="Em breve" muted />
      </div>

      <div className="rounded-lg border border-border bg-background-elevated">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-medium text-foreground">Embarcações</h2>
        </div>

        {loading && <p className="px-5 py-4 text-sm text-muted">Carregando barcos...</p>}

        {error && (
          <p className="mx-5 my-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {!loading && !error && barcos.length === 0 && (
          <p className="px-5 py-4 text-sm text-muted">Nenhum barco cadastrado.</p>
        )}

        {!loading && !error && barcos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">MMSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {barcos.map((barco) => (
                  <tr key={barco.id} className="hover:bg-background/60">
                    <td className="px-5 py-3">
                      <Link
                        href={`/barcos/${barco.id}`}
                        className="text-foreground hover:text-accent"
                      >
                        {barco.nome}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">{barco.mmsi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string | number;
  muted?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background-elevated p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold ${
          muted ? "text-muted" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
