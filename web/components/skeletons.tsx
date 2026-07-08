/**
 * Skeletons de carga (spec 031, O1). Dimensiones espejo de los componentes
 * reales — si cambia el layout de VenueCard/EventCard o del detalle, actualizar
 * acá también. El pulso se apaga con prefers-reduced-motion (globals.css).
 */

function Line({ w, h = "h-3" }: { w: string; h?: string }) {
  return (
    <div
      className={`${h} ${w} rounded skeleton-pulse`}
      style={{ background: "var(--card-2)" }}
    />
  );
}

/** Espejo de VenueCard: thumb 64px + título + meta. */
export function VenueCardSkeleton() {
  return (
    <div className="flex items-start gap-4 py-4 row-sep" aria-hidden>
      <div
        className="shrink-0 size-16 rounded-[10px] skeleton-pulse"
        style={{ background: "var(--card-2)" }}
      />
      <div className="flex-1 min-w-0 space-y-2 pt-1">
        <Line w="w-2/3" h="h-4" />
        <Line w="w-1/2" />
        <Line w="w-1/3" />
      </div>
    </div>
  );
}

/** Espejo de EventCard: bloque fecha 64px + título + meta. */
export function EventCardSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 row-sep" aria-hidden>
      <div
        className="shrink-0 size-16 rounded-[10px] skeleton-pulse"
        style={{ background: "var(--card-2)" }}
      />
      <div className="flex-1 min-w-0 space-y-2">
        <Line w="w-3/4" h="h-4" />
        <Line w="w-1/2" />
      </div>
    </div>
  );
}

/** Encabezado de listas (título de sección + contadores). */
export function ListHeaderSkeleton() {
  return (
    <div className="pt-8 pb-2 space-y-3" aria-hidden>
      <Line w="w-24" />
      <Line w="w-40" h="h-10" />
      <Line w="w-full" h="h-11" />
    </div>
  );
}

/** Espejo del detalle de lugar: héroe + título + bloques. */
export function VenueDetailSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div
        className="aspect-[4/3] w-full md:aspect-[16/6] md:rounded-[12px] skeleton-pulse"
        style={{ background: "var(--card-2)" }}
      />
      <div className="space-y-3 px-4 md:px-0">
        <Line w="w-1/2" h="h-7" />
        <Line w="w-1/3" />
        <Line w="w-full" />
        <Line w="w-5/6" />
      </div>
      <div className="flex gap-3 px-4 md:px-0">
        <div
          className="h-24 w-28 rounded-[12px] skeleton-pulse"
          style={{ background: "var(--card-2)" }}
        />
        <div
          className="h-24 flex-1 rounded-[12px] skeleton-pulse"
          style={{ background: "var(--card-2)" }}
        />
      </div>
    </div>
  );
}
