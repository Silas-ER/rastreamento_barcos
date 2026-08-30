"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getCurrentUser, type Cargo } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  adminOnly?: boolean;
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Painel", href: "/painel" },
  { label: "Mapa", href: "#", comingSoon: true },
  { label: "Alertas", href: "#", comingSoon: true },
  { label: "Relatórios", href: "#", comingSoon: true },
  { label: "Histórico", href: "#", comingSoon: true },
  { label: "Usuários", href: "/usuarios", adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [nome, setNome] = useState<string | null>(null);
  const [cargo, setCargo] = useState<Cargo | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCargo(user?.cargo ?? null);
    setNome(user?.sub ?? null);
  }, []);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-background-elevated">
      <div className="flex items-center gap-2 border-b border-border px-5 py-5">
        <span className="text-lg font-semibold text-foreground">
          Rastreamento de Barcos
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          if (item.adminOnly && cargo !== "admin") return null;

          if (item.comingSoon) {
            return (
              <div
                key={item.label}
                title="Em breve"
                className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm text-muted/50"
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
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
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

      <div className="border-t border-border px-4 py-4">
        {nome && (
          <div className="mb-3 text-sm">
            <p className="truncate text-foreground">{nome}</p>
            <p className="text-xs uppercase tracking-wide text-muted">
              {cargo === "admin" ? "Administrador" : "Consulta"}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full rounded-md border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
