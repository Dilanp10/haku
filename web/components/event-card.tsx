import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { Event } from "@haku/events";

const fmt = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Catamarca",
});

export function EventCard({ event }: { event: Event }) {
  return (
    <Link
      href={{ pathname: "/eventos/[slug]", query: { slug: event.slug } } as const}
      className="group block overflow-hidden rounded-lg border bg-card transition hover:border-primary/40 hover:shadow-sm"
    >
      <div className="aspect-[16/9] w-full bg-muted">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 font-semibold">{event.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {event.description ?? "—"}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {fmt.format(new Date(event.startsAt))}
          </span>
          {event.venueName ? (
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{event.venueName}</span>
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
