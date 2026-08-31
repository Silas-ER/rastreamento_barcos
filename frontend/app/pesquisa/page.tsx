"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, ResultadoPesquisa, parseResultadoPesquisa } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

// Heurística simples: se a consulta contém somente dígitos (e opcionalmente
// espaços), tratamos como MMSI; caso contrário, como busca por nome.
function isProbablyMmsi(query: string): boolean {
  return /^\d[\d\s]*$/.test(query.trim());
}

export default function PesquisaPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ResultadoPesquisa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buscou, setBuscou] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const termo = query.trim();
    if (!termo) return;

    setLoading(true);
    setError(null);
    setBuscou(true);

    try {
      const raw = isProbablyMmsi(termo)
        ? await api.pesquisarBarcos({ mmsi: termo })
        : await api.pesquisarBarcos({ nome: termo });
      setResultados(raw.map(parseResultadoPesquisa));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Erro ao pesquisar embarcações.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-foreground">Pesquisar embarcações</h1>
      <p className="mb-8 text-sm text-muted">
        Busque por nome ou MMSI. Resultados podem incluir embarcações ainda não cadastradas.
      </p>

      <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap items-end gap-4">
        <div className="min-w-[280px] flex-1">
          <label htmlFor="query" className="mb-1 block text-sm text-muted">
            Nome ou MMSI
          </label>
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: Aurora ou 123456789"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-md bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? "Pesquisando..." : "Pesquisar"}
        </button>
      </form>

      {error && (
        <p className="mb-6 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {!error && buscou && !loading && resultados.length === 0 && (
        <p className="mb-6 text-sm text-muted">Nenhum resultado encontrado.</p>
      )}

      {!error && !loading && resultados.length > 0 && (
        <div className="rounded-lg border border-border bg-background-elevated">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-medium text-foreground">Resultados</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">MMSI</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resultados.map((r, idx) => (
                <tr key={r.id ?? `${r.mmsi}-${idx}`} className="hover:bg-background/60">
                  <td className="px-5 py-3 text-foreground">{r.nome}</td>
                  <td className="px-5 py-3 text-muted">{r.mmsi}</td>
                  <td className="px-5 py-3">
                    {r.cadastrado === null ? (
                      <span className="text-xs text-muted">Desconhecido</span>
                    ) : r.cadastrado ? (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                        Cadastrado
                      </span>
                    ) : (
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                        Não cadastrado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
