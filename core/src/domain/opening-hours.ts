/**
 * Lógica de dominio pura para el estado de apertura de un venue.
 * No conoce Supabase, Next.js ni la zona horaria: recibe los rangos y un `Date` ya
 * expresado en la hora local relevante (el borde/web se encarga de la conversión de TZ).
 */

export interface OpeningRange {
  /** 0 = domingo … 6 = sábado */
  day: number;
  /** "HH:MM" o "HH:MM:SS" */
  opensAt: string;
  /** "HH:MM" o "HH:MM:SS" */
  closesAt: string;
}

export interface OpenState {
  open: boolean;
  /** Hora de cierre "HH:MM" del rango vigente, si está abierto. */
  closesAt?: string;
}

/** Normaliza "HH:MM[:SS]" a "HH:MM". */
function hhmm(t: string): string {
  return t.slice(0, 5);
}

/**
 * Determina si un venue está abierto en `now`, dado su conjunto de rangos.
 * Soporta:
 * - Múltiples rangos el mismo día (turno mañana + tarde).
 * - Rangos que cruzan la medianoche (ej. 21:00–05:00): abierto si la hora actual es
 *   `>= opensAt` (mismo día) o `<= closesAt` (madrugada del día siguiente).
 *
 * `now` debe estar en la hora local del venue (ej. America/Argentina/Catamarca).
 */
export function openStateAt(ranges: OpeningRange[], now: Date): OpenState {
  const dow = now.getDay();
  const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  for (const r of ranges) {
    if (r.day !== dow) continue;
    const o = hhmm(r.opensAt);
    const c = hhmm(r.closesAt);
    const crossesMidnight = o > c;
    const open = crossesMidnight ? cur >= o || cur <= c : cur >= o && cur <= c;
    if (open) return { open: true, closesAt: c };
  }
  return { open: false };
}
