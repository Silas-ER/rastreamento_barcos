"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api, ApiError, Usuario } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import Fab from "@/app/components/Fab";

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.cargo !== "admin") {
      router.replace("/painel");
      return;
    }

    api
      .listUsuarios()
      .then(setUsuarios)
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace(err.status === 401 ? "/login" : "/");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Erro ao carregar usuários.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-foreground">Usuários</h1>
      <p className="mb-8 text-sm text-muted">
        Gerencie quem tem acesso ao sistema e seus cargos.
      </p>

      {loading && <p className="text-muted">Carregando usuários...</p>}

      {error && (
        <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {!loading && !error && usuarios.length === 0 && (
        <p className="text-muted">Nenhum usuário cadastrado.</p>
      )}

      {!loading && !error && usuarios.length > 0 && (
        <table className="w-full overflow-hidden rounded-lg border border-border bg-background-elevated text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Cargo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td className="px-4 py-3 text-foreground">{usuario.nome}</td>
                <td className="px-4 py-3 text-foreground">{usuario.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                    {usuario.cargo}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && !error && (
        <Fab label="Adicionar usuário" onClick={() => setModalAberto(true)} />
      )}

      {modalAberto && (
        <NovoUsuarioModal
          onClose={() => setModalAberto(false)}
          onCreated={(usuario) => {
            setUsuarios((prev) => [...prev, usuario]);
            setModalAberto(false);
          }}
        />
      )}
    </div>
  );
}

function NovoUsuarioModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (usuario: Usuario) => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cargo, setCargo] = useState<"consulta" | "admin">("consulta");
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

    if (!nome.trim() || !email.trim() || !senha) {
      setErro("Preencha todos os campos.");
      return;
    }
    if (!email.includes("@")) {
      setErro("Informe um email válido.");
      return;
    }
    if (senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setEnviando(true);
    try {
      const usuario = await api.createUsuario({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        cargo,
      });
      onCreated(usuario);
    } catch (err) {
      setErro(
        err instanceof ApiError ? err.message : "Erro ao criar usuário. Tente novamente."
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
        aria-labelledby="novo-usuario-titulo"
        className="w-full max-w-sm rounded-lg border border-border bg-background-elevated p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="novo-usuario-titulo" className="text-lg font-semibold text-foreground">
            Novo usuário
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

          <div className="mb-4">
            <label htmlFor="email" className="mb-1 block text-sm text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="senha" className="mb-1 block text-sm text-muted">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              minLength={8}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="cargo" className="mb-1 block text-sm text-muted">
              Cargo
            </label>
            <select
              id="cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value as "consulta" | "admin")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            >
              <option value="consulta">Consulta</option>
              <option value="admin">Admin</option>
            </select>
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
