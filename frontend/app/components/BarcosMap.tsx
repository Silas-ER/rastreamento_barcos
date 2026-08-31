"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// O bundler não resolve os ícones padrão do Leaflet automaticamente em
// ambientes Next.js/Webpack, então os apontamos manualmente para o CDN.
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER: [number, number] = [-15, -47];

export interface MapMarker {
  id: string | number;
  lat: number;
  lon: number;
  label: string;
}

interface BarcosMapProps {
  markers: MapMarker[];
  polyline?: [number, number][];
  height?: string;
}

export default function BarcosMap({ markers, polyline, height = "480px" }: BarcosMapProps) {
  const center: [number, number] =
    markers.length > 0 ? [markers[0].lat, markers[0].lon] : DEFAULT_CENTER;

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-lg border border-border">
      <MapContainer
        center={center}
        zoom={markers.length > 0 ? 8 : 4}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {polyline && polyline.length > 1 && (
          <Polyline positions={polyline} pathOptions={{ color: "#14b8a6" }} />
        )}
        {markers.map((marker) => (
          <Marker key={marker.id} position={[marker.lat, marker.lon]} icon={markerIcon}>
            <Popup>{marker.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
