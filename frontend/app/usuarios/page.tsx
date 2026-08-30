"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError, Usuario } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    </div>
  );
}
