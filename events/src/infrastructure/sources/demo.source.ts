import type { EventSourcePort } from "../../application/ports/event-source.port.js";
import type { RawEvent } from "../../domain/event.js";

/**
 * Fuente de demostración: genera eventos sintéticos pero realistas de Catamarca con
 * `startsAt` FIJOS (no relativos a "now"). Esto garantiza que el `dedupeHash`
 * sea estable entre corridas y que `upsertMany` no inserte duplicados.
 *
 * Útil para:
 *   - Validar el pipeline end-to-end sin depender de una fuente real volátil.
 *   - Demos en local. Desactivable en `event_sources.active=false` para apagarla.
 */
const SOURCE_KEY = "demo-catamarca";

const FIXED_EVENTS: ReadonlyArray<Omit<RawEvent, "sourceKey">> = [
  {
    title: "Peña folclórica en el Pucará",
    description: "Música y baile catamarqueños hasta la madrugada. Entrada libre.",
    startsAt: "2026-07-04T22:00:00Z",
    venueName: "Pucará de Aconquija",
    address: "Andalgalá, Catamarca",
    location: { lat: -27.6047, lng: -66.3186 },
    category: "musica",
  },
  {
    title: "Feria Nacional del Poncho",
    description: "Artesanías, gastronomía y espectáculos en el predio ferial.",
    startsAt: "2026-07-19T16:00:00Z",
    venueName: "Predio Ferial Catamarca",
    address: "Av. Alem 1000, S. F. del Valle de Catamarca",
    location: { lat: -28.4554, lng: -65.7886 },
    category: "feria",
  },
  {
    title: "Cine al aire libre en Parque Adán Quiroga",
    description: "Ciclo de cine argentino contemporáneo. Llevá manta y reposera.",
    startsAt: "2026-07-12T21:00:00Z",
    venueName: "Parque Adán Quiroga",
    address: "S. F. del Valle de Catamarca",
    location: { lat: -28.4733, lng: -65.7799 },
    category: "cine",
  },
  {
    title: "Mercado de productores en Plaza 25",
    description: "Productos locales: aceitunas, vinos, quesos, dulces caseros.",
    startsAt: "2026-07-06T10:00:00Z",
    endsAt: "2026-07-06T14:00:00Z",
    venueName: "Plaza 25 de Mayo",
    address: "Sarmiento y Rivadavia, S. F. del Valle de Catamarca",
    location: { lat: -28.4696, lng: -65.7795 },
    category: "feria",
  },
  {
    title: "Concierto de la Orquesta Sinfónica Provincial",
    description: "Repertorio de música argentina. Entrada con bono contribución.",
    startsAt: "2026-08-02T20:30:00Z",
    venueName: "Teatro de la Juventud",
    address: "S. F. del Valle de Catamarca",
    location: { lat: -28.4717, lng: -65.7800 },
    category: "musica",
  },
  {
    title: "Recorrido vino y empanadas en El Rodeo",
    description: "Tour por bodegas locales con almuerzo regional. Cupo limitado.",
    startsAt: "2026-07-26T15:00:00Z",
    venueName: "El Rodeo",
    address: "El Rodeo, Ambato, Catamarca",
    location: { lat: -28.2333, lng: -65.8667 },
    category: "gastronomia",
  },
];

export function createDemoSource(): EventSourcePort {
  return {
    key: SOURCE_KEY,
    async fetch(_now: Date): Promise<RawEvent[]> {
      return FIXED_EVENTS.map((e) => ({ ...e, sourceKey: SOURCE_KEY }));
    },
  };
}

export { SOURCE_KEY as DEMO_SOURCE_KEY };
