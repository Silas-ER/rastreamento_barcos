"use client";

import { boatSvg, colorForIndex, formatDate, formatLatLon, type MapMarker } from "./mapaUtils";

interface MapaLegendaProps {
  markers: MapMarker[];
  selecionadoId?: string | number | null;
  onSelect?: (id: string | number) => void;
}

export default function MapaLegenda({ markers, selecionadoId, onSelect }: MapaLegendaProps) {
  if (markers.length === 0) return null;

  return (
    <ul className="flex gap-1.5 overflow-x-auto pb-1">
      {markers.map((m, i) => {
        const color = m.color ?? colorForIndex(i);
        const ativo = selecionadoId != null && String(selecionadoId) === String(m.id);
        return (
          <li key={m.id} className="shrink-0">
            <button
              type="button"
              onClick={() => onSelect?.(m.id)}
              className={`flex w-[150px] flex-col gap-0.5 rounded-md border px-2 py-1.5 text-left transition-colors ${
                ativo
                  ? "border-accent bg-accent/10"
                  : "border-border bg-background-elevated/80 hover:border-accent/60"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 shrink-0"
                  aria-hidden
                  dangerouslySetInnerHTML={{ __html: boatSvg(color, 12) }}
                />
                <span className="truncate text-xs font-medium text-foreground">
                  {m.nome ?? m.label}
                </span>
              </span>
              <span className="text-[11px] text-muted">{formatLatLon(m.lat, m.lon)}</span>
              <span className="text-[11px] text-muted">
                Atualizado: {formatDate(m.atualizadoEm)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
