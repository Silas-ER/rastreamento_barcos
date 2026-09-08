"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { boatSvg, colorForIndex, formatLatLon, type MapMarker } from "./mapaUtils";

export type { MapMarker };
export { MARKER_PALETTE, colorForIndex, formatLatLon, formatDate, boatSvg } from "./mapaUtils";

function boatIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.55))">${boatSvg(color)}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 26],
    popupAnchor: [0, -22],
  });
}

const DEFAULT_CENTER: [number, number] = [-15, -47];

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 6);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [map, points]);
  return null;
}

function FocusMarker({
  selecionadoId,
  markerRefs,
}: {
  selecionadoId: string | number | null | undefined;
  markerRefs: React.MutableRefObject<Record<string, L.Marker>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (selecionadoId === null || selecionadoId === undefined) return;
    const marker = markerRefs.current[String(selecionadoId)];
    if (!marker) return;
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 6));
    marker.openPopup();
  }, [map, selecionadoId, markerRefs]);
  return null;
}

interface BarcosMapProps {
  markers: MapMarker[];
  polyline?: [number, number][];
  height?: string;
  selecionadoId?: string | number | null;
  onPopupClose?: () => void;
}

export default function BarcosMap({
  markers,
  polyline,
  height = "480px",
  selecionadoId,
  onPopupClose,
}: BarcosMapProps) {
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const resolved = useMemo(
    () => markers.map((m, i) => ({ ...m, color: m.color ?? colorForIndex(i) })),
    [markers],
  );

  const points = useMemo<[number, number][]>(
    () => resolved.map((m) => [m.lat, m.lon]),
    [resolved],
  );

  return (
    <div style={{ height }} className="relative w-full overflow-hidden rounded-lg border border-border">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={4}
        minZoom={2}
        maxBounds={[
          [-85, -180],
          [85, 180],
        ]}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%", background: "var(--background)" }}
      >
        <FitBounds points={points} />
        <FocusMarker selecionadoId={selecionadoId} markerRefs={markerRefs} />
        <TileLayer
          noWrap
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {polyline && polyline.length > 1 && (
          <Polyline positions={polyline} pathOptions={{ color: "#14b8a6" }} />
        )}
        {resolved.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lon]}
            icon={boatIcon(marker.color)}
            ref={(instance) => {
              if (instance) markerRefs.current[String(marker.id)] = instance;
              else delete markerRefs.current[String(marker.id)];
            }}
            eventHandlers={{ popupclose: () => onPopupClose?.() }}
          >
            <Popup>
              <span className="font-medium">{marker.nome ?? marker.label}</span>
              <br />
              {formatLatLon(marker.lat, marker.lon)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
