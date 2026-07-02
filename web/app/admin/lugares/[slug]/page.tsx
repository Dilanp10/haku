import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Globe, Instagram, MapPin, ExternalLink } from "lucide-react";
import {
  getVenueBySlug,
  listFoodTypes,
  createSupabaseCoreRepository,
  type Venue,
} from "@haku/core";
import { requireProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { VenueMap } from "@/components/venue-map";
import { QuickStatusBtn } from "../quick-status-btn";
import { SuggestionReview } from "../suggestion-review";

interface SuggestedHour {
  day: number;
  opens: string;
  closes: string;
}

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<Venue["status"], string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};
const STATUS_TONE: Record<Venue["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-primary/10 text-primary",
  archived: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminVenueDetailPage({ params }: Props) {
  await requireProfile("admin");
  const { slug } = await params;

  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);

  const [venueRes, foodTypesRes] = await Promise.all([
    getVenueBySlug(repo, { slug }),
    listFoodTypes(repo),
  ]);

  if (!venueRes.ok || !venueRes.value) notFound();
  const venue = venueRes.value;

  const { data: ratingStats } = await supabase
    .from("venue_rating_stats")
    .select("average_rating, rating_count")
    .eq("venue_id", venue.id)
    .maybeSingle();
  const allFoodTypes = foodTypesRes.ok ? foodTypesRes.value : [];
  const venueFoodTypes = allFoodTypes.filter((ft) => venue.foodTypeIds.includes(ft.id));

  // Metadata del wizard de sugerencias (guardada en attributes)
  const attrs = (venue.attributes ?? {}) as Record<string, unknown>;
  const suggestedHours = Array.isArray(attrs["_hours"])
    ? (attrs["_hours"] as SuggestedHour[])
    : [];
  const suggestedAudio =
    typeof attrs["_audio_url"] === "string" ? (attrs["_audio_url"] as string) : null;

  // Horarios ya cargados en venue_hours
  const { data: hoursData } = await supabase
    .from("venue_hours")
    .select("day_of_week, opens_at, closes_at, closed")
    .eq("venue_id", venue.id)
    .order("day_of_week");
  const currentHours = hoursData ?? [];

  const markers = venue.location
    ? [{ lat: venue.location.lat, lng: venue.location.lng, title: venue.name }]
    : [];

  return (
    <main className="container py-6">
      {/* Barra de acciones admin */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
        <Link
          href="/admin/lugares"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Lugares
        </Link>

        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONE[venue.status]}`}>
          {STATUS_LABEL[venue.status]}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <QuickStatusBtn id={venue.id} slug={venue.slug} status={venue.status} />
          <Link
            href={`/admin/lugares/${slug}/editar`}
            className="rounded-md border px-3 py-1.5 text-sm hover:border-primary/40"
          >
            Editar
          </Link>
          {venue.status === "published" && (
            <Link
              href={`/lugares/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:border-primary/40"
            >
              Ver página pública <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Panel de revisión de sugerencia (audio + horarios pendientes) */}
      {(suggestedHours.length > 0 || suggestedAudio) && (
        <div className="mb-6">
          <SuggestionReview
            venueId={venue.id}
            slug={venue.slug}
            hours={suggestedHours}
            audioUrl={suggestedAudio}
          />
        </div>
      )}

      {/* Contenido del venue (mismo layout que la página pública) */}
      <header className="mt-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Catamarca
        </p>
        <h1 className="mt-1 text-3xl font-bold">{venue.name}</h1>
        {venue.address && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> {venue.address}
          </p>
        )}
      </header>

      {venue.coverImageUrl && (
        <div className="relative mt-6 aspect-[16/7] overflow-hidden rounded-lg border">
          <Image
            src={venue.coverImageUrl}
            alt={venue.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 80vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Info principal */}
        <div className="space-y-6 lg:col-span-2">
          {venue.description && (
            <section>
              <p className="leading-relaxed text-muted-foreground">{venue.description}</p>
            </section>
          )}

          {venueFoodTypes.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Qué encontrás
              </h2>
              <div className="flex flex-wrap gap-2">
                {venueFoodTypes.map((ft) => (
                  <span
                    key={ft.id}
                    className="rounded-full border bg-muted px-3 py-1 text-xs font-medium"
                  >
                    {ft.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {venue.location && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Cómo llegar
              </h2>
              <div className="overflow-hidden rounded-lg border">
                <VenueMap
                  markers={markers}
                  center={venue.location}
                  className="h-[300px] w-full"
                />
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <InfoCard label="Visitas">
            <span className="text-2xl font-bold">{venue.viewCount.toLocaleString("es-AR")}</span>
          </InfoCard>

          <InfoCard label="Rating">
            {ratingStats?.average_rating != null ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{ratingStats.average_rating}</span>
                <span className="text-sm text-muted-foreground">
                  / 5 ({ratingStats.rating_count} {ratingStats.rating_count === 1 ? "voto" : "votos"})
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Sin puntuaciones aún</span>
            )}
          </InfoCard>

          {venue.priceRange && (
            <InfoCard label="Precio">
              <span className="text-lg font-bold text-primary">{venue.priceRange}</span>
            </InfoCard>
          )}

          {currentHours.length > 0 && (
            <InfoCard label="Horarios cargados">
              <ul className="space-y-1 text-sm">
                {DAY_ORDER.map((day) => {
                  const entries = currentHours.filter(
                    (h) => h.day_of_week === day && !h.closed,
                  );
                  if (entries.length === 0) return null;
                  return (
                    <li key={day} className="flex gap-2">
                      <span className="w-10 font-medium text-muted-foreground">
                        {DAY_LABELS[day]}
                      </span>
                      <span>
                        {entries
                          .map(
                            (e) =>
                              `${e.opens_at.slice(0, 5)}–${e.closes_at.slice(0, 5)}`,
                          )
                          .join(", ")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </InfoCard>
          )}

          {(venue.phone || venue.website || venue.instagram) && (
            <InfoCard label="Contacto">
              <ul className="space-y-2 text-sm">
                {venue.phone && (
                  <li>
                    <a
                      href={`tel:${venue.phone}`}
                      className="inline-flex items-center gap-2 hover:text-primary"
                    >
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {venue.phone}
                    </a>
                  </li>
                )}
                {venue.website && (
                  <li>
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 hover:text-primary"
                    >
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      Sitio web
                    </a>
                  </li>
                )}
                {venue.instagram && (
                  <li>
                    <a
                      href={`https://instagram.com/${venue.instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 hover:text-primary"
                    >
                      <Instagram className="h-4 w-4 text-muted-foreground" />
                      @{venue.instagram.replace(/^@/, "")}
                    </a>
                  </li>
                )}
              </ul>
            </InfoCard>
          )}
        </aside>
      </div>
    </main>
  );
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
