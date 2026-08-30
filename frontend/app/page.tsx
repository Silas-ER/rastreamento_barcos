"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";

const RECURSOS = [
  {
    icone: "⚓",
    titulo: "Cadastro de embarcações",
    descricao: "Mantenha um cadastro centralizado das embarcações da frota, com nome e MMSI.",
  },
  {
    icone: "🔐",
    titulo: "Controle de acesso por cargo",
    descricao:
      "Administradores gerenciam usuários e embarcações; o perfil de consulta acessa só a visualização.",
  },
  {
    icone: "📋",
    titulo: "Painel centralizado",
    descricao: "Acompanhe as embarcações cadastradas em um só lugar, com espaço para crescer.",
  },
];

export default function LandingPage() {
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    setAutenticado(!!getCurrentUser());
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
          <span className="text-lg font-semibold text-white">
            Rastreamento de Barcos
          </span>
          <Link
            href={autenticado ? "/painel" : "/login"}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-white/90"
          >
            {autenticado ? "Ir para o painel" : "Entrar"}
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-8 py-20 text-center">
          <h1 className="mx-auto max-w-2xl text-4xl font-semibold leading-tight text-white">
            Gestão e rastreamento da sua frota em um só lugar
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Cadastre embarcações, controle quem tem acesso ao sistema e acompanhe
            tudo por um painel simples, feito para crescer junto com a operação.
          </p>
          <Link
            href={autenticado ? "/painel" : "/login"}
            className="mt-8 inline-block rounded-md bg-white px-6 py-3 font-medium text-background transition-colors hover:bg-white/90"
          >
            {autenticado ? "Ir para o painel" : "Acessar o sistema"}
          </Link>

          <div className="mx-auto mt-16 h-px w-24 bg-white/20" />
        </section>

        <section className="border-t border-white/10 bg-background-elevated">
          <div className="mx-auto max-w-6xl px-8 py-16">
            <h2 className="mb-10 text-center text-xl font-semibold text-white">
              Tudo que você precisa em um só lugar
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {RECURSOS.map((recurso) => (
                <div
                  key={recurso.titulo}
                  className="rounded-lg border border-white/10 bg-background p-6"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg">
                    {recurso.icone}
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-white">
                    {recurso.titulo}
                  </h3>
                  <p className="text-sm text-muted">{recurso.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-8 py-6 text-center text-sm text-muted">
        Rastreamento de Barcos — acesso restrito a usuários autorizados.
      </footer>
    </div>
  );
}
