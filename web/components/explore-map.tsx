"use client";

import { useEffect, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, CircleMarker, useMap } from "react-leaflet";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

const CATAMARCA_CENTER: [number, number] = [-28.4696, -65.7795];
const DEFAULT_ZOOM = 14;

// OSM tiles con filtro CSS para modo oscuro (fallback definido en SDD D1).
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export interface ExplorePoint {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
  open: boolean;
  closesAt: string | null;
}

function pinSvg(ring?: boolean): string {
  const ringEl = ring
    ? `<circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.4"/>`
    : "";
  // El stroke usa una clase CSS para adaptarse al tema (negro en Mono, blanco en Noche sobre el pin).
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 28 28">
    ${ringEl}
    <circle cx="14" cy="14" r="10" fill="currentColor" class="haku-pin-stroke" stroke-width="2.5"/>
  </svg>`;
}

function makeIcon(open: boolean, selected: boolean): L.DivIcon {
  // El color se setea vía className que mapea a var(--accent)/var(--fg)/var(--fg-30) en globals.css
  const cls = selected
    ? "haku-pin haku-pin-selected"
    : open
      ? "haku-pin haku-pin-open"
      : "haku-pin haku-pin-closed";
  return L.divIcon({
    html: pinSvg(selected),
    className: cls,
    iconSize: selected ? [36, 36] : [28, 28],
    iconAnchor: selected ? [18, 18] : [14, 14],
  });
}

function ThemeSync() {
  const map = useMap();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const container = map.getContainer();
    const tilePane = container.querySelector(".leaflet-tile-pane") as HTMLElement | null;
    if (tilePane) {
      tilePane.style.filter =
        resolvedTheme === "dark"
          ? "invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9) saturate(0.8)"
          : "";
    }
  }, [resolvedTheme, map]);

  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [lat, lng, map]);
  return null;
}

interface ExploreMapProps {
  points: ExplorePoint[];
  selectedSlug: string | null;
  onSelectSlug: (slug: string) => void;
}

export default function ExploreMap({ points, selectedSlug, onSelectSlug }: ExploreMapProps) {
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  const selected = points.find((p) => p.slug === selectedSlug);

  const handleMarkerClick = useCallback(
    (slug: string) => {
      onSelectSlug(slug);
    },
    [onSelectSlug],
  );

  const handleMarkerDblClick = useCallback(
    (slug: string) => {
      router.push(`/lugares/${slug}`);
    },
    [router],
  );

  return (
    <MapContainer
      center={CATAMARCA_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      zoomControl={false}
      className="h-full w-full"
      style={{ background: "var(--bg)" }}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
      <ThemeSync />
      {selected && <FlyTo lat={selected.lat} lng={selected.lng} />}

      {points.map((p) => (
        <Marker
          key={p.slug}
          position={[p.lat, p.lng]}
          icon={makeIcon(p.open, p.slug === selectedSlug)}
          eventHandlers={{
            click: () => handleMarkerClick(p.slug),
            dblclick: () => handleMarkerDblClick(p.slug),
          }}
        />
      ))}

      {userCoords && (
        <CircleMarker
          center={[userCoords.lat, userCoords.lng]}
          radius={7}
          pathOptions={{
            color: "#3B82F6",
            fillColor: "#3B82F6",
            fillOpacity: 0.35,
            weight: 2.5,
          }}
        />
      )}
    </MapContainer>
  );
}
