import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, ExternalLink, Navigation } from "lucide-react";
import {
  getEventBySlug,
  createSupabaseEventRepository,
} from "@haku/events";
import { createServerSupabase } from "@/lib/supabase/server";
import { VenueMapClient } from "@/components/venue-map-client";

export const revalidate = 600;

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
    <main id="main" className="mx-auto max-w-2xl px-4 py-8 pb-bottom">
      <Link
        href="/eventos"
        className="inline-flex items-center gap-1 text-data transition-opacity hover:opacity-70"
        style={{ color: "var(--fg-50)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Todos los eventos
      </Link>

      <header className="mt-4">
        <p className="text-section mb-1">Catamarca · Evento</p>
        <h1 className="text-brand text-3xl" style={{ color: "var(--fg)" }}>
          {event.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm" style={{ color: "var(--fg-50)" }}>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-4 w-4" style={{ color: "var(--accent)" }} />
            {fmt.format(new Date(event.startsAt))}
          </span>
          {event.venueName && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" style={{ color: "var(--accent)" }} />
              {event.venueName}
              {event.address && ` — ${event.address}`}
            </span>
          )}
        </div>
      </header>

      {event.imageUrl && (
        <div
          className="mt-6 overflow-hidden rounded-[12px] border"
          style={{ borderColor: "var(--line)" }}
        >
          <img
            src={event.imageUrl}
            alt={event.title}
            className="aspect-[16/7] w-full object-cover"
          />
        </div>
      )}

      <div className="mt-8 space-y-6">
        {event.description && (
          <p
            className="text-[15px] leading-relaxed whitespace-pre-line"
            style={{ color: "var(--fg-70)" }}
          >
            {event.description}
          </p>
        )}

        {/* Info cards */}
        <div className="flex flex-wrap gap-3">
          {event.endsAt && (
            <InfoCard label="Hasta">
              <p className="text-sm" style={{ color: "var(--fg)" }}>
                {fmt.format(new Date(event.endsAt))}
              </p>
            </InfoCard>
          )}

          {event.category && (
            <InfoCard label="Categoría">
              <span
                className="rounded-full border px-3 py-1 text-xs capitalize"
                style={{ borderColor: "var(--line-2)", color: "var(--fg-70)", background: "var(--card-bg)" }}
              >
                {event.category}
              </span>
            </InfoCard>
          )}
        </div>

        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-medium transition active:opacity-80"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Más información <ExternalLink className="h-4 w-4" />
          </a>
        )}

        {event.location && (
          <section>
            <h2 className="text-section mb-2">Ubicación</h2>
            <div
              className="overflow-hidden rounded-[12px] border"
              style={{ borderColor: "var(--line)" }}
            >
              <VenueMapClient
                markers={markers}
                center={event.location}
                className="h-[250px] w-full"
              />
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${event.location.lat},${event.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-[10px] border px-4 py-2 text-sm font-medium transition active:opacity-80"
              style={{ borderColor: "var(--line-2)", color: "var(--accent)" }}
            >
              <Navigation className="h-4 w-4" /> Abrir en Google Maps
            </a>
          </section>
        )}
      </div>
    </main>
  );
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-[12px] border p-4"
      style={{ borderColor: "var(--line)", background: "var(--card-bg)" }}
    >
      <p className="text-section mb-2">{label}</p>
      {children}
    </div>
  );
}
