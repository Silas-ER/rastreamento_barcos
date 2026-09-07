import Link from "next/link";

const FEATURES = [
  {
    title: "Localização atual",
    description:
      "Veja no mapa a posição mais recente de cada embarcação de pesca cadastrada, atualizada a partir de dados públicos de rastreamento.",
  },
  {
    title: "Histórico de trajeto",
    description:
      "Consulte o caminho percorrido por uma embarcação em um período, para entender rotas e padrões de deslocamento.",
  },
  {
    title: "Pesquisa por nome ou MMSI",
    description:
      "Encontre rapidamente uma embarcação específica pesquisando pelo nome do barco ou pelo número MMSI.",
  },
  {
    title: "Dados do Global Fishing Watch",
    description:
      "As posições são obtidas a partir de dados públicos do Global Fishing Watch, plataforma internacional de monitoramento pesqueiro.",
  },
];

export default function LandingPage() {
  return (
    <div className="w-full">
      <section className="border-b border-border bg-background-elevated px-8 py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h1 className="mb-4 text-3xl font-semibold text-foreground sm:text-4xl">
            Rastreamento de Barcos de Pesca
          </h1>
          <p className="mb-8 max-w-2xl text-base text-muted">
            Monitore embarcações de pesca cadastradas com base em dados públicos do
            Global Fishing Watch: localização atual, histórico de trajeto e busca por
            nome ou MMSI, tudo em um só lugar.
          </p>
          <Link
            href="/login"
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Entrar
          </Link>
        </div>
      </section>

      <section className="px-8 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-xl font-semibold text-foreground">
            O que você pode fazer
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-border bg-background-elevated p-5"
              >
                <h3 className="mb-2 text-sm font-medium text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
