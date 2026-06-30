import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, ExternalLink } from "lucide-react";
import {
  getEventBySlug,
  createSupabaseEventRepository,
} from "@haku/events";
import { createServerSupabase } from "@/lib/supabase/server";
import { VenueMap } from "@/components/venue-map";

export const revalidate = 600; // ISR 10 min

interface Props {
  params: Promise<{ slug: string }>;
}

const fmt = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Catamarca",
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const repo = createSupabaseEventRepository(supabase);
  const event = await repo.getBySlug(slug);
  if (!event || event.status !== "published") return { title: "Evento no encontrado" };
  return {
    title: event.title,
    description: event.description ?? `${event.title} — Catamarca`,
    alternates: { canonical: `/eventos/${slug}` },
    openGraph: {
      title: `${event.title} · Haku`,
      description: event.description ?? event.title,
      url: `/eventos/${slug}`,
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const repo = createSupabaseEventRepository(supabase);

  const res = await getEventBySlug(repo, slug);
  if (!res.ok || !res.value) notFound();
  const event = res.value;

  const markers = event.location
    ? [{ lat: event.location.lat, lng: event.location.lng, title: event.title }]
    : [];

  return (
    <main id="main" className="container py-10">
      <Link
        href="/eventos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Todos los eventos
      </Link>

      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Catamarca · Evento
        </p>
        <h1 className="mt-1 text-3xl font-bold">{event.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            {fmt.format(new Date(event.startsAt))}
          </span>
          {event.venueName && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {event.venueName}
              {event.address && ` — ${event.address}`}
            </span>
          )}
        </div>
      </header>

      {event.imageUrl && (
        <div className="mt-6 overflow-hidden rounded-lg border">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="aspect-[16/7] w-full object-cover"
          />
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {event.description && (
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          )}

          {event.location && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Ubicación
              </h2>
              <div className="overflow-hidden rounded-lg border">
                <VenueMap
                  markers={markers}
                  center={event.location}
                  className="h-[300px] w-full"
                />
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          {event.endsAt && (
            <div className="rounded-lg border bg-card p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Hasta
              </p>
              <p className="text-sm">{fmt.format(new Date(event.endsAt))}</p>
            </div>
          )}

          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Más información <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {event.category && (
            <div className="rounded-lg border bg-card p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Categoría
              </p>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                {event.category}
              </span>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
