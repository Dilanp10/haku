"use client";

import { useEffect, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, CircleMarker, useMap } from "react-leaflet";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

const CATAMARCA_CENTER: [number, number] = [-28.4696, -65.7795];
const DEFAULT_ZOOM = 14;

const TILE_LIGHT = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

export interface ExplorePoint {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
  open: boolean;
  closesAt: string | null;
}

function pinSvg(fill: string, ring?: boolean): string {
  const ringEl = ring
    ? `<circle cx="14" cy="14" r="12" fill="none" stroke="${fill}" stroke-width="2.5" opacity="0.4"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 28 28">
    ${ringEl}
    <circle cx="14" cy="14" r="10" fill="${fill}" stroke="white" stroke-width="2"/>
  </svg>`;
}

function makeIcon(open: boolean, selected: boolean): L.DivIcon {
  const fill = open ? (selected ? "var(--accent, #FF5A36)" : "#0B0B0C") : "#B5B5BA";
  return L.divIcon({
    html: pinSvg(selected ? "#FF5A36" : fill, selected),
    className: "haku-pin",
    iconSize: selected ? [36, 36] : [28, 28],
    iconAnchor: selected ? [18, 18] : [14, 14],
  });
}

function ThemeSync() {
  const map = useMap();
  const { resolvedTheme } = useTheme();
  const [layer, setLayer] = useState<L.TileLayer | null>(null);

  useEffect(() => {
    if (layer) map.removeLayer(layer);
    const url = resolvedTheme === "dark" ? TILE_DARK : TILE_LIGHT;
    const newLayer = L.tileLayer(url, { attribution: TILE_ATTR }).addTo(map);
    setLayer(newLayer);
    return () => {
      map.removeLayer(newLayer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
