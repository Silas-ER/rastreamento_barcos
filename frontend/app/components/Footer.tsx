import Logo from "./Logo";

export default function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer id="site-footer" className="w-full border-t border-border bg-background-elevated">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-8 py-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md">
          <Logo />
          <p className="mt-2 text-sm text-muted">
            Rastreamento de embarcações de pesca com dados públicos do Global Fishing Watch.
          </p>
        </div>
        <div className="text-sm text-muted sm:text-right">
          <p>Dados: Global Fishing Watch / OpenStreetMap</p>
          <p className="mt-1">&copy; {ano} Rastreamento de Barcos</p>
        </div>
      </div>
    </footer>
  );
}
