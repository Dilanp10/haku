import Link from "next/link";
import Image from "next/image";
import type { Event } from "@haku/events";

const fmtDay = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  timeZone: "America/Argentina/Catamarca",
});
const fmtMonth = new Intl.DateTimeFormat("es-AR", {
  month: "short",
  timeZone: "America/Argentina/Catamarca",
});
const fmtTime = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Catamarca",
});

export function EventCard({ event, distanceKm }: { event: Event; distanceKm?: number }) {
  const d = new Date(event.startsAt);
  const meta = [fmtTime.format(d), event.venueName].filter(Boolean).join(" · ");

  return (
    <div className="group relative flex items-center gap-4 py-4 row-sep animate-fade-in-up">
      <Link
        href={{ pathname: "/eventos/[slug]", query: { slug: event.slug } } as const}
        aria-label={event.title}
        className="absolute inset-0 z-10 transition-opacity active:opacity-70"
      />

      {/* Date block o thumb */}
      {event.imageUrl ? (
        <div
          className="relative shrink-0 size-16 rounded-[10px] overflow-hidden"
          style={{ background: "var(--card-2)" }}
        >
          <Image
            src={event.imageUrl}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
      ) : (
        <div
          className="relative shrink-0 size-16 rounded-[10px] flex flex-col items-center justify-center"
          style={{ background: "var(--terra-wash)", color: "var(--terra-deep)" }}
        >
          <span className="text-brand text-2xl leading-none">{fmtDay.format(d)}</span>
          <span className="text-data uppercase mt-0.5" style={{ fontSize: "10px" }}>
            {fmtMonth.format(d).replace(".", "")}
          </span>
        </div>
      )}

      {/* Text */}
      <div className="relative flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="text-brand text-[19px] leading-tight line-clamp-2"
            style={{ color: "var(--fg)" }}
          >
            {event.title}
          </h3>
          {distanceKm !== undefined && (
            <span
              className="text-data shrink-0"
              style={{ color: "var(--terra)" }}
            >
              {formatDistance(distanceKm)}
            </span>
          )}
        </div>
        {meta && (
          <p
            className="text-xs mt-0.5 truncate"
            style={{ color: "var(--fg-50)" }}
          >
            {meta}
          </p>
        )}
        {event.description && (
          <p
            className="text-[13px] mt-1 line-clamp-1"
            style={{ color: "var(--fg-70)" }}
          >
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
