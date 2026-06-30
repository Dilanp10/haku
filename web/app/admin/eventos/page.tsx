import Link from "next/link";
import { CalendarDays, MapPin, Pencil } from "lucide-react";
import {
  listAllEvents,
  createSupabaseEventRepository,
  type Event,
} from "@haku/events";
import type { EventStatus } from "@haku/shared";
import { requireProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { rejectEventAction } from "./actions";
import { QuickEventStatusBtn } from "./quick-event-status-btn";
import { TriggerIngestionBtn } from "./trigger-ingestion-btn";

export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Catamarca",
});

const STATUS_LABELS: Record<EventStatus, string> = {
  pending:   "Pendiente",
  published: "Publicado",
  rejected:  "Rechazado",
};

const STATUS_BADGE: Record<EventStatus, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  rejected:  "bg-red-100 text-red-800",
};

const FILTER_PILLS = [
  { label: "Todos",      estado: null },
  { label: "Pendientes", estado: "pending" as EventStatus },
  { label: "Publicados", estado: "published" as EventStatus },
  { label: "Rechazados", estado: "rejected" as EventStatus },
];

export default async function AdminEventosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  await requireProfile("admin");

  const { estado } = await searchParams;
  const validStatuses: EventStatus[] = ["pending", "published", "rejected"];
  const statusFilter = validStatuses.includes(estado as EventStatus)
    ? (estado as EventStatus)
    : undefined;

  const supabase = await createServerSupabase();
  const repo = createSupabaseEventRepository(supabase);
  const res = await listAllEvents(repo, { status: statusFilter, limit: 200 });

  if (!res.ok) {
    return (
      <main className="container py-10">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="mt-2 text-sm text-muted-foreground">{res.error.message}</p>
      </main>
    );
  }

  const events = res.value;

  return (
    <main className="container py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Eventos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {events.length} evento{events.length !== 1 ? "s" : ""}
            {statusFilter ? ` — ${STATUS_LABELS[statusFilter].toLowerCase()}s` : ""}
          </p>
        </div>
        <TriggerIngestionBtn />
      </header>

      {/* Filtro por estado */}
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Filtrar por estado">
        {FILTER_PILLS.map(({ label, estado: e }) => {
          const href =
            e === null ? "/admin/eventos" : `/admin/eventos?estado=${e}`;
          const active =
            e === null ? statusFilter === undefined : statusFilter === e;
          return (
            <Link
              key={label}
              href={href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "border hover:bg-muted"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {events.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
          {statusFilter === "pending" ? (
            <>
              No hay eventos pendientes. Disparar la ingesta:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                curl -X POST -H "Authorization: Bearer $EVENTS_INGEST_TOKEN" http://localhost:3000/api/events/ingest
              </code>
            </>
          ) : (
            <p>No hay eventos{statusFilter ? ` con estado ${STATUS_LABELS[statusFilter].toLowerCase()}` : ""}.</p>
          )}
        </div>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </ul>
      )}
    </main>
  );
}

function EventRow({ event }: { event: Event }) {
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-medium">{event.title}</h3>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[event.status]}`}
          >
            {STATUS_LABELS[event.status]}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {event.description ?? "—"}
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {fmt.format(new Date(event.startsAt))}
          </span>
          {event.venueName && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {event.venueName}
            </span>
          )}
          <span className="rounded bg-muted px-1.5 py-0.5">{event.sourceKey}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href={`/admin/eventos/${event.slug}/editar`}
          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm transition hover:bg-muted"
        >
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Link>
        {event.status === "pending" && (
          <>
            <QuickEventStatusBtn id={event.id} status="pending" />
            <form action={rejectEventAction}>
              <input type="hidden" name="id" value={event.id} />
              <button className="rounded-md border px-3 py-1.5 text-sm transition hover:border-destructive/50 hover:text-destructive">
                Rechazar
              </button>
            </form>
          </>
        )}
        {event.status !== "pending" && (
          <QuickEventStatusBtn id={event.id} status={event.status} />
        )}
      </div>
    </li>
  );
}
