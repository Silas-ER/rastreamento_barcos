"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api, ApiError, Barco } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import Fab from "@/app/components/Fab";

export default function BarcosPage() {
  const router = useRouter();
  const [barcos, setBarcos] = useState<Barco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    setIsAdmin(user.cargo === "admin");

    api
      .listBarcos()
      .then(setBarcos)
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace(err.status === 401 ? "/login" : "/");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Erro ao carregar barcos.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-foreground">Barcos</h1>
      <p className="mb-8 text-sm text-muted">
        Embarcações cadastradas para monitoramento.
      </p>

      {loading && <p className="text-muted">Carregando barcos...</p>}

      {error && (
        <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {!loading && !error && barcos.length === 0 && (
        <p className="text-muted">Nenhum barco cadastrado.</p>
      )}

      {!loading && !error && barcos.length > 0 && (
        <table className="w-full overflow-hidden rounded-lg border border-border bg-background-elevated text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">MMSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {barcos.map((barco) => (
              <tr key={barco.id}>
                <td className="px-4 py-3 text-foreground">{barco.nome}</td>
                <td className="px-4 py-3 text-foreground">{barco.mmsi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && !error && isAdmin && (
        <Fab label="Adicionar barco" onClick={() => setModalAberto(true)} />
      )}

      {modalAberto && (
        <NovoBarcoModal
          onClose={() => setModalAberto(false)}
          onCreated={(barco) => {
            setBarcos((prev) => [...prev, barco]);
            setModalAberto(false);
          }}
        />
      )}
    </div>
  );
}

function NovoBarcoModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (barco: Barco) => void;
}) {
  const [nome, setNome] = useState("");
  const [mmsi, setMmsi] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);

    if (!nome.trim() || !mmsi.trim()) {
      setErro("Preencha todos os campos.");
      return;
    }
    if (!/^\d{9}$/.test(mmsi.trim())) {
      setErro("O MMSI deve conter exatamente 9 dígitos.");
      return;
    }

    setEnviando(true);
    try {
      const barco = await api.createBarco({ nome: nome.trim(), mmsi: mmsi.trim() });
      onCreated(barco);
    } catch (err) {
      setErro(
        err instanceof ApiError ? err.message : "Erro ao criar barco. Tente novamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="novo-barco-titulo"
        className="w-full max-w-sm rounded-lg border border-border bg-background-elevated p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="novo-barco-titulo" className="text-lg font-semibold text-foreground">
            Novo barco
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-muted transition-colors hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="nome" className="mb-1 block text-sm text-muted">
              Nome
            </label>
            <input
              id="nome"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="mmsi" className="mb-1 block text-sm text-muted">
              MMSI
            </label>
            <input
              id="mmsi"
              type="text"
              inputMode="numeric"
              required
              value={mmsi}
              onChange={(e) => setMmsi(e.target.value.replace(/\D/g, "").slice(0, 9))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          {erro && (
            <p className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {erro}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {enviando ? "Criando..." : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
