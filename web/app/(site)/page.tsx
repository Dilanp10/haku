import Link from "next/link";
import { MapPin, CalendarDays, ArrowRight } from "lucide-react";
import {
  listVenues,
  listCategories,
  createSupabaseCoreRepository,
  type Category,
} from "@haku/core";
import {
  listUpcomingEvents,
  createSupabaseEventRepository,
} from "@haku/events";
import { createServerSupabase } from "@/lib/supabase/server";
import { VenueCard } from "@/components/venue-card";
import { EventCard } from "@/components/event-card";

export const revalidate = 3600; // ISR 1h

export default async function HomePage() {
  const supabase = await createServerSupabase();
  const coreRepo = createSupabaseCoreRepository(supabase);
  const eventsRepo = createSupabaseEventRepository(supabase);

  const [venuesRes, categoriesRes, eventsRes] = await Promise.all([
    listVenues(coreRepo, { pagination: { page: 1, pageSize: 3 } }),
    listCategories(coreRepo),
    listUpcomingEvents(eventsRepo, { limit: 3 }),
  ]);

  const venues = venuesRes.ok ? venuesRes.value.items : [];
  const catById = new Map<string, Category>(
    (categoriesRes.ok ? categoriesRes.value : []).map((c) => [c.id, c]),
  );
  const events = eventsRes.ok ? eventsRes.value : [];

  return (
    <main id="main">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/8 to-background border-b">
        <div className="container py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Catamarca · Argentina
          </p>
          <h1 className="mt-3 text-5xl font-extrabold tracking-tight">
            Haku
          </h1>
          <p className="mt-4 mx-auto max-w-lg text-lg text-muted-foreground">
            "Vamos" en quechua. Descubrí lugares, gastronomía y eventos cerca tuyo.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/lugares"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Explorar lugares <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/lugares/cerca"
              className="inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-semibold transition hover:border-primary/40"
            >
              <MapPin className="h-4 w-4 text-primary" /> Cerca tuyo
            </Link>
          </div>
        </div>
      </section>

      {/* Lugares destacados */}
      <section className="container py-12">
        <SectionHeader
          title="Lugares"
          subtitle="Gastronomía y salidas en Catamarca."
          href="/lugares"
        />
        {venues.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <VenueCard key={v.id} venue={v} category={catById.get(v.categoryId)} />
            ))}
          </div>
        ) : (
          <EmptyState
            text="Todavía no hay lugares publicados."
            href="/lugares"
            linkText="Ver todos"
          />
        )}
      </section>

      {/* Próximos eventos */}
      <section className="border-t bg-muted/40">
        <div className="container py-12">
          <SectionHeader
            title="Próximos eventos"
            subtitle="Qué está pasando en Catamarca."
            href="/eventos"
            icon={<CalendarDays className="h-5 w-5" />}
          />
          {events.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <EmptyState
              text="Todavía no hay eventos publicados."
              href="/eventos"
              linkText="Ver eventos"
            />
          )}
        </div>
      </section>
    </main>
  );
}

function SectionHeader({
  title,
  subtitle,
  href,
  icon,
}: {
  title: string;
  subtitle: string;
  href: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="mb-1 flex items-center gap-2 text-primary">
          {icon}
          <span className="text-xs font-semibold uppercase tracking-widest">Catamarca</span>
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Ver todos <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function EmptyState({
  text,
  href,
  linkText,
}: {
  text: string;
  href: string;
  linkText: string;
}) {
  return (
    <div className="mt-6 rounded-lg border bg-card p-10 text-center text-muted-foreground">
      {text}{" "}
      <Link href={href} className="text-primary hover:underline">
        {linkText}
      </Link>
    </div>
  );
}
