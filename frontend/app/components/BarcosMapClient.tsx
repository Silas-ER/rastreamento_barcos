"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "./BarcosMap";

// O Leaflet acessa `window` no import, então o mapa precisa ser carregado
// somente no cliente (sem SSR).
const BarcosMap = dynamic(() => import("./BarcosMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] w-full items-center justify-center rounded-lg border border-border bg-background-elevated text-sm text-muted md:h-[480px]">
      Carregando mapa...
    </div>
  ),
});

export type { MapMarker };
export default BarcosMap;
