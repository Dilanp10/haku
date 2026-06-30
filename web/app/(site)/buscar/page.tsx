import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, MapPin, ArrowRight } from "lucide-react";
import {
  listVenues,
  listCategories,
  createSupabaseCoreRepository,
  type Category,
} from "@haku/core";
import { listUpcomingEvents, createSupabaseEventRepository } from "@haku/events";
import { createServerSupabase } from "@/lib/supabase/server";
import { SearchInput } from "@/components/search-input";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Buscar",
  robots: { index: false },
};

const fmtDate = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Catamarca",
});

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

  const [venuesRes, categoriesRes, eventsRes] = query
    ? await Promise.all([
        listVenues(coreRepo, {
          search: query,
          pagination: { page: 1, pageSize: 6 },
        }),
        listCategories(coreRepo),
        listUpcomingEvents(eventsRepo, { search: query, limit: 6 }),
      ])
    : [null, null, null];

  const venues = venuesRes?.ok ? venuesRes.value.items : [];
  const venuesTotal = venuesRes?.ok ? venuesRes.value.total : 0;
  const catById = new Map<string, Category>(
    (categoriesRes?.ok ? categoriesRes.value : []).map((c) => [c.id, c]),
  );
  const events = eventsRes?.ok ? eventsRes.value : [];
  const total = venues.length + events.length;

  return (
    <main id="main" className="container max-w-3xl py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Buscar</h1>
        {query && (
          <p className="mt-1 text-muted-foreground">
            {total} resultado{total !== 1 ? "s" : ""} para{" "}
            <span className="font-semibold text-foreground">&ldquo;{query}&rdquo;</span>
          </p>
        )}
      </header>

      <SearchInput
        value={query}
        placeholder="Buscar lugares, eventos..."
        action="/buscar"
      />

      {!query && (
        <div className="mt-12 text-center text-muted-foreground">
          <p className="text-sm">Ingresa un termino para buscar lugares y eventos en Catamarca.</p>
        </div>
      )}

      {query && total === 0 && (
        <div className="mt-12 rounded-lg border bg-card p-10 text-center text-muted-foreground">
          <p>Sin resultados para &ldquo;{query}&rdquo;.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/lugares" className="text-sm text-primary hover:underline">
              Ver todos los lugares
            </Link>
            <Link href="/eventos" className="text-sm text-primary hover:underline">
              Ver todos los eventos
            </Link>
          </div>
        </div>
      )}

      {venues.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Lugares</h2>
            {venuesTotal > 6 && (
              <Link
                href={`/lugares?q=${encodeURIComponent(query)}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Ver los {venuesTotal} resultados <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <ul className="mt-3 divide-y rounded-lg border bg-card">
            {venues.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/lugares/${v.slug}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{v.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {v.address ?? "Catamarca"}
                    </p>
                  </div>
                  {catById.get(v.categoryId) && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {catById.get(v.categoryId)!.name}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {events.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Eventos</h2>
            <Link
              href={`/eventos?q=${encodeURIComponent(query)}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Ver en eventos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="mt-3 divide-y rounded-lg border bg-card">
            {events.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/eventos/${e.slug}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{e.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      {fmtDate.format(new Date(e.startsAt))}
                      {e.venueName && <span className="ml-1 truncate">&middot; {e.venueName}</span>}
                    </p>
                  </div>
                  {e.category && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {e.category}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
