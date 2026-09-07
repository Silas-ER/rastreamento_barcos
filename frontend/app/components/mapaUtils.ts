// Helpers puros compartilhados entre o mapa (client-only) e a legenda.
// Sem dependência de Leaflet/window, seguro para SSR.

export interface MapMarker {
  id: string | number;
  lat: number;
  lon: number;
  /** Nome exibido no popup / legenda. */
  label: string;
  /** Nome curto da embarcação para a legenda (default: label). */
  nome?: string;
  /** Cor do marcador; se ausente, derivada do índice. */
  color?: string;
  /** Data/hora ISO da última atualização (exibida como dd/mm/yyyy). */
  atualizadoEm?: string | null;
}

// Paleta fixa e determinística: a mesma embarcação (mesmo índice) mantém a cor.
export const MARKER_PALETTE = [
  "#2dd4bf",
  "#f97316",
  "#a855f7",
  "#facc15",
  "#38bdf8",
  "#f43f5e",
  "#4ade80",
  "#e879f9",
  "#fb923c",
  "#818cf8",
];

export function colorForIndex(index: number): string {
  const len = MARKER_PALETTE.length;
  return MARKER_PALETTE[((index % len) + len) % len];
}

export function formatLatLon(lat: number, lon: number): string {
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${d.getUTCFullYear()}`;
}

export function boatSvg(color: string, size = 30): string {
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 14L1.6 18.2C5 20 19 20 22.4 18.2L21 14Z" fill="${color}" stroke="#0b1120" stroke-width="1" stroke-linejoin="round"/>
    <path d="M5 14V6H13L17.5 10.5V14Z" fill="${color}" stroke="#0b1120" stroke-width="1" stroke-linejoin="round"/>
    <path d="M8.5 6V3.4H11.6V6" stroke="#0b1120" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
