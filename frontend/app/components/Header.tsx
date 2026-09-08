"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getCurrentUser, type Cargo } from "@/lib/auth";
import Logo from "./Logo";

interface NavItem {
  label: string;
  href: string;
  adminOnly?: boolean;
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Mapa", href: "/rastreamento" },
  { label: "Histórico", href: "/historico" },
  { label: "Pesquisar", href: "/pesquisa" },
  { label: "Alertas", href: "#", comingSoon: true },
  { label: "Relatórios", href: "#", comingSoon: true },
  { label: "Usuários", href: "/usuarios", adminOnly: true },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [nome, setNome] = useState<string | null>(null);
  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCargo(user?.cargo ?? null);
    setNome(user?.sub ?? null);
    setChecked(true);
  }, []);

  function handleLogout() {
    clearToken();
    setMenuOpen(false);
    router.push("/login");
  }

  const isLoggedIn = checked && nome !== null;

  if (!isLoggedIn) {
    return (
      <header className="fixed inset-x-0 top-0 z-[1100] flex h-16 w-full shrink-0 items-center justify-between border-b border-border bg-background-elevated px-5">
        <Logo />
        <Link
          href="/login"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Entrar
        </Link>
      </header>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-[1100] flex h-16 w-full shrink-0 items-center gap-6 border-b border-border bg-background-elevated px-5">
      <Logo />

      <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          if (item.adminOnly && cargo !== "admin") return null;

          if (item.comingSoon) {
            return (
              <div
                key={item.label}
                title="Em breve"
                className="flex cursor-not-allowed items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted/50"
              >
                <span>{item.label}</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide">
                  Em breve
                </span>
              </div>
            );
          }

          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative shrink-0">
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <span className="max-w-[10rem] truncate">{nome ?? "Conta"}</span>
          <span className="text-xs uppercase tracking-wide text-muted">
            {cargo === "admin" ? "Admin" : cargo === "consulta" ? "Consulta" : ""}
          </span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-md border border-border bg-background-elevated py-1 shadow-lg">
            {nome && (
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-sm text-foreground">{nome}</p>
                <p className="text-xs uppercase tracking-wide text-muted">
                  {cargo === "admin" ? "Administrador" : "Consulta"}
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="block w-full px-3 py-2 text-left text-sm text-muted transition-colors hover:text-accent"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
