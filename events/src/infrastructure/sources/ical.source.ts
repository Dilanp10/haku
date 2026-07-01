import type { EventSourcePort } from "../../application/ports/event-source.port";
import type { RawEvent } from "../../domain/event";

// ────────────────────────────────────────────────────────────────────────────
// Mini-parser iCal (RFC 5545 subset) — sin dependencias externas.
// Solo procesa VEVENT; ignora VTIMEZONE, VTODO, etc.
// Soporta: SUMMARY, DTSTART, DTEND, DESCRIPTION, LOCATION, URL, GEO.
// ────────────────────────────────────────────────────────────────────────────

interface ICalProps {
  SUMMARY?: string;
  DTSTART?: string;
  "DTSTART;VALUE=DATE"?: string;
  DTEND?: string;
  "DTEND;VALUE=DATE"?: string;
  DESCRIPTION?: string;
  LOCATION?: string;
  URL?: string;
  GEO?: string;
  [key: string]: string | undefined;
}

/** Deshace el line-folding de iCal (continuaciones con espacio/tab al inicio). */
function unfold(text: string): string {
  return text.replace(/\r?\n[ \t]/g, "");
}

/** Quita escapes de valor iCal: \, → ,  \; → ;  \n → newline  \\ → \ */
function unescape(val: string): string {
  return val
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\n/gi, "\n")
    .replace(/\\\\/g, "\\");
}

/** Parsea un bloque VEVENT línea a línea → ICalProps. */
function parseVEvent(block: string): ICalProps {
  const props: ICalProps = {};
  for (const line of block.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    // La clave puede tener parámetros: "DTSTART;TZID=America/...:20260719T160000"
    const keyPart = line.slice(0, idx).toUpperCase();
    const value = unescape(line.slice(idx + 1));
    // Normalizar claves con TZID a clave base para simplificar el acceso.
    const baseKey = keyPart.split(";")[0]!;
    // Guardamos la clave completa para VALUE=DATE y la base.
    props[keyPart] = value;
    if (keyPart !== baseKey) props[baseKey] = value;
  }
  return props;
}

/**
 * Convierte un valor DTSTART/DTEND iCal a ISO 8601 UTC.
 * Formatos manejados:
 *   - "20260719T190000Z"         → UTC directo
 *   - "20260719T160000"          → asumimos UTC-3 (Catamarca) → convertimos a UTC
 *   - "20260719"                 → solo fecha → medianoche UTC-3
 *   - "20260719T160000+00:00"    → con offset explícito
 */
function dtToIso(dt: string | undefined): string | null {
  if (!dt) return null;
  const s = dt.trim();

  // Solo fecha: YYYYMMDD
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T03:00:00.000Z`; // 00:00 ARG = 03:00 UTC
  }

  // Con tiempo: YYYYMMDDTHHMMSS[Z|±HH:MM]
  const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z|[+-]\d{2}:?\d{2})?$/);
  if (!m) return null;
  const [, y, mo, d, h, min, sec, tz] = m;
  const base = `${y}-${mo}-${d}T${h}:${min}:${sec}`;

  if (!tz || tz === "Z") {
    // Z = UTC; sin tz = hora local Catamarca (UTC-3) → sumar 3h
    const date = new Date(tz ? `${base}Z` : `${base}+00:00`);
    if (!tz) date.setHours(date.getHours() + 3);
    return isNaN(date.getTime()) ? null : date.toISOString();
  }

  // Offset explícito ±HH:MM o ±HHMM
  const off = tz.replace(/(\d{2})(\d{2})$/, "$1:$2");
  const date = new Date(`${base}${off}`);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

/** Extrae todos los bloques VEVENT de un texto iCal. */
function extractVEvents(ical: string): ICalProps[] {
  const unfolded = unfold(ical);
  const events: ICalProps[] = [];
  const regex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(unfolded)) !== null) {
    events.push(parseVEvent(m[1]!));
  }
  return events;
}

/** Convierte ICalProps a RawEvent. Devuelve null si faltan campos obligatorios. */
function vEventToRaw(props: ICalProps, sourceKey: string): RawEvent | null {
  const title = props.SUMMARY?.trim();
  if (!title) return null;

  // DTSTART puede venir como DTSTART o DTSTART;VALUE=DATE
  const dtRaw = props.DTSTART ?? props["DTSTART;VALUE=DATE"];
  const startsAt = dtToIso(dtRaw);
  if (!startsAt) return null;

  const dtEndRaw = props.DTEND ?? props["DTEND;VALUE=DATE"];
  const endsAt = dtToIso(dtEndRaw) ?? undefined;

  const description = props.DESCRIPTION?.replace(/\\n/g, "\n").trim() || undefined;
  const url = props.URL?.trim() || undefined;

  // LOCATION puede tener "Venue, Dirección" o solo uno de los dos.
  let venueName: string | undefined;
  let address: string | undefined;
  if (props.LOCATION) {
    const parts = props.LOCATION.split(",").map((s) => s.trim());
    venueName = parts[0] || undefined;
    address = parts.slice(1).join(", ").trim() || undefined;
  }

  // GEO: "lat;lng"
  let location: { lat: number; lng: number } | undefined;
  if (props.GEO) {
    const [lat, lng] = props.GEO.split(";").map(Number);
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      location = { lat, lng };
    }
  }

  return {
    sourceKey,
    title,
    startsAt,
    ...(endsAt ? { endsAt } : {}),
    ...(description ? { description } : {}),
    ...(url ? { url } : {}),
    ...(venueName ? { venueName } : {}),
    ...(address ? { address } : {}),
    ...(location ? { location } : {}),
  };
}

// ────────────────────────────────────────────────────────────────────────────

export function createICalSource(config: { key: string; url: string; userAgent: string }): EventSourcePort {
  return {
    key: config.key,
    async fetch(_now: Date): Promise<RawEvent[]> {
      const res = await fetch(config.url, {
        headers: {
          "user-agent": config.userAgent,
          accept: "text/calendar, application/ics, */*",
        },
      });
      if (!res.ok) throw new Error(`Fuente iCal ${config.key}: HTTP ${res.status}`);
      const text = await res.text();

      return extractVEvents(text)
        .map((p) => vEventToRaw(p, config.key))
        .filter((e): e is RawEvent => e !== null);
    },
  };
}
