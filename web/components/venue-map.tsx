"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Marker {
  lat: number;
  lng: number;
  title: string;
  href?: string;
}

interface Props {
  markers: Marker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

/**
 * Mapa Leaflet client-only. Se monta una sola vez por instancia y se actualizan
 * los marcadores. Evita pasar tiles por SSR (Leaflet requiere window/DOM).
 */
export function VenueMap({ markers, center, zoom = 13, className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const first = markers[0];
    const initialCenter = center ?? (first ? { lat: first.lat, lng: first.lng } : { lat: -28.4696, lng: -65.7795 });
    const map = L.map(ref.current).setView([initialCenter.lat, initialCenter.lng], zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // Inicialización única; cambios de markers/center se aplican en el efecto de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const m of markers) {
      const marker = L.marker([m.lat, m.lng]).bindPopup(
        m.href ? `<a href="${m.href}">${escapeHtml(m.title)}</a>` : escapeHtml(m.title),
      );
      marker.addTo(layer);
    }
  }, [markers]);

  return <div ref={ref} className={className ?? "h-80 w-full rounded-lg border"} />;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
