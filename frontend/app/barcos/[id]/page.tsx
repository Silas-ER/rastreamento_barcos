"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError, Barco } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export default function BarcoDetalhePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [barco, setBarco] = useState<Barco | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    api
      .getBarco(params.id)
      .then(setBarco)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          return;
        }
        setError(err instanceof ApiError ? err.message : "Erro ao carregar o barco.");
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <Link href="/painel" className="mb-6 inline-block text-sm text-accent hover:text-accent-hover">
        &larr; Voltar para embarcações
      </Link>

      {loading && <p className="text-muted">Carregando...</p>}

      {notFound && (
        <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          Barco não encontrado.
        </p>
      )}

      {error && (
        <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {!loading && !error && !notFound && barco && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-background-elevated p-6 lg:col-span-1">
            <h1 className="mb-4 text-xl font-semibold text-foreground">{barco.nome}</h1>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">ID</dt>
                <dd className="text-foreground">{barco.id}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">MMSI</dt>
                <dd className="text-foreground">{barco.mmsi}</dd>
              </div>
            </dl>
          </div>

          <div className="flex items-center justify-center rounded-lg border border-border bg-background-elevated p-6 text-sm text-muted lg:col-span-2">
            Posição e histórico de rota em tempo real — em breve.
          </div>
        </div>
      )}
    </div>
  );
}
