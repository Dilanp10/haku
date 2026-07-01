"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer, CircleMarker } from "react-leaflet";

const CATAMARCA_CENTER = { lat: -28.4696, lng: -65.7795 };
const DEFAULT_ZOOM = 14;

export interface MapPoint {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  kind: "venue" | "event";
  meta?: string | null;
  category?: string | null;
}

function pinSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path fill="${color}" stroke="white" stroke-width="2"
      d="M14 1C6.8 1 1 6.8 1 14c0 9.5 13 21 13 21s13-11.5 13-21c0-7.2-5.8-13-13-13z"/>
    <circle cx="14" cy="14" r="4.5" fill="white"/>
  </svg>`;
}

function buildIcon(color: string): L.DivIcon {
  return L.divIcon({
    html: pinSvg(color),
    className: "haku-pin",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
  });
}

const iconVenue = buildIcon("#D67849"); // terra
const iconEvent = buildIcon("#8AA265"); // moss

type Coords = { lat: number; lng: number };

export default function HakuMap({ points }: { points: MapPoint[] }) {
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  return (
    <MapContainer
      center={[CATAMARCA_CENTER.lat, CATAMARCA_CENTER.lng]}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {points.map((p) => (
        <Marker
          key={`${p.kind}-${p.slug}`}
          position={[p.lat, p.lng]}
          icon={p.kind === "event" ? iconEvent : iconVenue}
        >
          <Popup>
            <div style={{ color: "var(--fg)" }}>
              <div
                className="text-brand text-base leading-tight"
                style={{ color: "var(--fg)" }}
              >
                {p.name}
              </div>
              {(p.category || p.meta) && (
                <div className="text-xs mt-0.5" style={{ color: "var(--fg-50)" }}>
                  {[p.category, p.meta].filter(Boolean).join(" · ")}
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 text-xs mt-1.5 font-mono">
                <span
                  aria-hidden
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: p.kind === "event" ? "var(--moss)" : "var(--terra)" }}
                />
                <span style={{ color: p.kind === "event" ? "var(--moss)" : "var(--terra)" }}>
                  {p.kind === "event" ? "Evento" : "Lugar"}
                </span>
              </div>
              <Link
                href={`/${p.kind === "event" ? "eventos" : "lugares"}/${p.slug}` as never}
                className="block mt-2 font-medium text-sm"
                style={{ color: "var(--terra)" }}
              >
                Ver ficha →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}

      {coords && (
        <CircleMarker
          center={[coords.lat, coords.lng]}
          radius={8}
          pathOptions={{
            color: "#E07B4C",
            fillColor: "#E07B4C",
            fillOpacity: 0.4,
            weight: 2,
          }}
        />
      )}
    </MapContainer>
  );
}
