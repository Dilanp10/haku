import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  listVenues,
  listCategories,
  createSupabaseCoreRepository,
  type Category,
} from "@haku/core";
import { listUpcomingEvents, createSupabaseEventRepository } from "@haku/events";
import { createServerSupabase } from "@/lib/supabase/server";
import { getVenueStatuses } from "@/lib/venue-open-now";
import { SearchInput } from "@/components/search-input";
import { VenueCard } from "@/components/venue-card";
import { EventCard } from "@/components/event-card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Buscar",
  robots: { index: false },
};

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const supabase = await createServerSupabase();
  const coreRepo = createSupabaseCoreRepository(supabase);
  const eventsRepo = createSupabaseEventRepository(supabase);

  const [venuesRes, categoriesRes, eventsRes, statuses] = query
    ? await Promise.all([
        listVenues(coreRepo, { search: query, pagination: { page: 1, pageSize: 6 } }),
        listCategories(coreRepo),
        listUpcomingEvents(eventsRepo, { search: query, limit: 6 }),
        getVenueStatuses(supabase),
      ])
    : [null, null, null, null];

  const venues = venuesRes?.ok ? venuesRes.value.items : [];
  const venuesTotal = venuesRes?.ok ? venuesRes.value.total : 0;
  const catById = new Map<string, Category>(
    (categoriesRes?.ok ? categoriesRes.value : []).map((c) => [c.id, c]),
  );
  const events = eventsRes?.ok ? eventsRes.value : [];
  const total = venues.length + events.length;

  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-8 pb-bottom">
      <header className="mb-6">
        <p className="text-section mb-1">Catamarca</p>
        <h1 className="text-brand text-3xl" style={{ color: "var(--fg)" }}>
          Buscar
        </h1>
        {query && (
          <p className="mt-1 text-sm" style={{ color: "var(--fg-50)" }}>
            {total} resultado{total !== 1 ? "s" : ""} para{" "}
            <span className="text-brand" style={{ color: "var(--fg)" }}>
              &ldquo;{query}&rdquo;
            </span>
          </p>
        )}
      </header>

      <SearchInput
        value={query}
        placeholder="Buscar lugares, eventos..."
        action="/buscar"
      />

      {!query && (
        <div className="mt-12 text-center" style={{ color: "var(--fg-50)" }}>
          <p className="text-sm">
            Ingresá un término para buscar lugares y eventos en Catamarca.
          </p>
        </div>
      )}

      {query && total === 0 && (
        <div
          className="mt-12 rounded-[12px] border p-10 text-center text-sm"
          style={{ borderColor: "var(--line)", background: "var(--card-bg)", color: "var(--fg-50)" }}
        >
          Sin resultados para &ldquo;{query}&rdquo;.
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/lugares" className="text-sm hover:underline" style={{ color: "var(--terra)" }}>
              Ver todos los lugares
            </Link>
            <Link href="/eventos" className="text-sm hover:underline" style={{ color: "var(--terra)" }}>
              Ver todos los eventos
            </Link>
          </div>
        </div>
      )}

      {venues.length > 0 && (
        <section className="mt-8">
          <div
            className="flex items-end justify-between gap-2 pb-2 border-b"
            style={{ borderColor: "var(--line)" }}
          >
            <h2 className="text-brand text-xl" style={{ color: "var(--fg)" }}>Lugares</h2>
            {venuesTotal > 6 && (
              <Link
                href={`/lugares?q=${encodeURIComponent(query)}`}
                className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: "var(--terra)" }}
              >
                Ver los {venuesTotal} <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <div className="mt-1">
            {venues.map((v, i) => {
              const open = statuses?.open.get(v.id);
              const known = statuses?.knownIds.has(v.id) ?? false;
              return (
                <VenueCard
                  key={v.id}
                  venue={v}
                  category={catById.get(v.categoryId)}
                  priority={i < 2}
                  openNow={!!open}
                  {...(open?.closesAt ? { closesAt: open.closesAt } : {})}
                  closed={!open && known}
                />
              );
            })}
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section className="mt-8">
          <div
            className="flex items-end justify-between gap-2 pb-2 border-b"
            style={{ borderColor: "var(--line)" }}
          >
            <h2 className="text-brand text-xl" style={{ color: "var(--fg)" }}>Eventos</h2>
            <Link
              href={`/eventos?q=${encodeURIComponent(query)}`}
              className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
              style={{ color: "var(--terra)" }}
            >
              Ver en eventos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-1">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
