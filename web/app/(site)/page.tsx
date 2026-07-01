import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
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

export const revalidate = 3600;

export default async function HomePage() {
  const supabase = await createServerSupabase();
  const coreRepo = createSupabaseCoreRepository(supabase);
  const eventsRepo = createSupabaseEventRepository(supabase);

  const [venuesRes, categoriesRes, eventsRes] = await Promise.all([
    listVenues(coreRepo, { pagination: { page: 1, pageSize: 4 } }),
    listCategories(coreRepo),
    listUpcomingEvents(eventsRepo, { limit: 4 }),
  ]);

  const venues = venuesRes.ok ? venuesRes.value.items : [];
  const catById = new Map<string, Category>(
    (categoriesRes.ok ? categoriesRes.value : []).map((c) => [c.id, c]),
  );
  const events = eventsRes.ok ? eventsRes.value : [];

  return (
    <main id="main" className="mx-auto max-w-2xl px-4 sm:px-6 pb-bottom">
      {/* Hero tipográfico */}
      <header className="pt-8 pb-6">
        <p className="text-section mb-2">Catamarca · Argentina</p>
        <h1
          className="text-brand leading-none"
          style={{ fontSize: "clamp(3rem,12vw,4.5rem)", color: "var(--terra)" }}
        >
          Haku.
        </h1>
        <p className="mt-2 text-[15px]" style={{ color: "var(--fg-70)" }}>
          &ldquo;Vamos&rdquo; en quechua. Descubrí lugares, gastronomía y eventos cerca tuyo.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/lugares"
            className="inline-flex items-center gap-2 rounded-button px-4 py-2 text-sm font-medium transition active:opacity-80"
            style={{ background: "var(--terra)", color: "#fff" }}
          >
            Explorar lugares <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/lugares/cerca"
            className="inline-flex items-center gap-2 rounded-button border px-4 py-2 text-sm font-medium transition active:opacity-80"
            style={{ borderColor: "var(--line-2)", color: "var(--fg)" }}
          >
            <MapPin className="h-4 w-4" style={{ color: "var(--terra)" }} /> Cerca tuyo
          </Link>
        </div>
      </header>

      {/* Lugares */}
      <section className="pt-6">
        <SectionHeader title="Lugares" subtitle="Gastronomía y salidas" href="/lugares" />
        {venues.length > 0 ? (
          <div className="mt-2">
            {venues.map((v, i) => (
              <VenueCard
                key={v.id}
                venue={v}
                category={catById.get(v.categoryId)}
                priority={i < 2}
              />
            ))}
          </div>
        ) : (
          <EmptyState text="Todavía no hay lugares publicados." href="/lugares" linkText="Ver todos" />
        )}
      </section>

      {/* Eventos */}
      <section className="pt-10">
        <SectionHeader title="Próximos eventos" subtitle="Qué está pasando" href="/eventos" />
        {events.length > 0 ? (
          <div className="mt-2">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <EmptyState text="Todavía no hay eventos publicados." href="/eventos" linkText="Ver eventos" />
        )}
      </section>
    </main>
  );
}

function SectionHeader({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3 pb-2 border-b" style={{ borderColor: "var(--line)" }}>
      <div>
        <p className="text-section">Catamarca</p>
        <h2 className="text-brand text-2xl" style={{ color: "var(--fg)" }}>
          {title}
        </h2>
        <p className="mt-0.5 text-xs" style={{ color: "var(--fg-50)" }}>
          {subtitle}
        </p>
      </div>
      <Link
        href={href}
        className="shrink-0 inline-flex items-center gap-1 text-xs font-medium hover:underline"
        style={{ color: "var(--terra)" }}
      >
        Ver todos <ArrowRight className="h-3 w-3" />
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
    <div
      className="mt-4 rounded-card border p-8 text-center text-sm"
      style={{ borderColor: "var(--line)", background: "var(--card-bg)", color: "var(--fg-50)" }}
    >
      {text}{" "}
      <Link href={href} className="hover:underline" style={{ color: "var(--terra)" }}>
        {linkText}
      </Link>
    </div>
  );
}
