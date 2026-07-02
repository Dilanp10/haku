import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import {
  listUpcomingEvents,
  createSupabaseEventRepository,
  type Event,
} from "@haku/events";
import { distanceKm as computeDistanceKm } from "@haku/core";
import { createServerSupabase } from "@/lib/supabase/server";
import { EventCard } from "@/components/event-card";
import { SearchInput } from "@/components/search-input";
import { LocateMeInline } from "@/components/locate-me-inline";

export const metadata: Metadata = {
  title: "Eventos",
  description: "Próximos eventos en Catamarca: peñas, ferias, conciertos y más.",
  alternates: { canonical: "/eventos" },
  openGraph: {
    title: "Eventos · Haku",
    description: "Qué está pasando en Catamarca. Próximas fechas, actualizadas automáticamente.",
    url: "/eventos",
  },
};

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  categoria?: string;
  lat?: string;
  lng?: string;
}

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createServerSupabase();
  const repo = createSupabaseEventRepository(supabase);

  const lat = sp.lat !== undefined ? Number(sp.lat) : NaN;
  const lng = sp.lng !== undefined ? Number(sp.lng) : NaN;
  const userLocation =
    Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;

  const [eventsRes, categories] = await Promise.all([
    listUpcomingEvents(repo, {
      limit: userLocation ? 60 : 30,
      ...(sp.q ? { search: sp.q } : {}),
      ...(sp.categoria ? { category: sp.categoria } : {}),
    }),
    repo.listEventCategories(),
  ]);

  if (!eventsRes.ok) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-brand text-2xl" style={{ color: "var(--fg)" }}>
          No pudimos cargar los eventos
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--fg-50)" }}>
          {eventsRes.error.message}
        </p>
      </main>
    );
  }

  let events: Event[] = eventsRes.value;
  const distances = new Map<string, number>();
  if (userLocation) {
    for (const e of events) {
      if (e.location) distances.set(e.id, computeDistanceKm(userLocation, e.location));
    }
    events = [...events].sort((a, b) => {
      const da = distances.get(a.id) ?? Infinity;
      const db = distances.get(b.id) ?? Infinity;
      return da - db;
    });
  }

  const hasFilters = !!(sp.q || sp.categoria);
  const activeFilters: Record<string, string> = {};
  if (sp.q) activeFilters["q"] = sp.q;
  if (sp.categoria) activeFilters["categoria"] = sp.categoria;

  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-8 pb-bottom">
      <header className="mb-6">
        <p className="text-section mb-1">Catamarca</p>
        <h1 className="text-brand text-3xl" style={{ color: "var(--fg)" }}>
          Eventos
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-50)" }}>
          {events.length} {events.length === 1 ? "evento" : "eventos"}
          {hasFilters ? " con estos filtros" : " próximos"}.
        </p>
      </header>

      {/* Filtros */}
      <aside
        className="mb-6 space-y-4 rounded-[12px] border p-4"
        style={{ borderColor: "var(--line)", background: "var(--card-bg)" }}
      >
        <div className="flex items-center justify-between">
          <span
            className="flex items-center gap-1.5 text-data uppercase"
            style={{ color: "var(--fg-50)" }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
          </span>
          {hasFilters && (
            <Link
              href="/eventos"
              className="inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
              style={{ color: "var(--fg-50)" }}
            >
              <X className="h-3 w-3" /> Limpiar todo
            </Link>
          )}
        </div>

        <SearchInput
          value={sp.q}
          placeholder="Buscar por título…"
          action="/eventos"
          preserveParams={{ ...activeFilters, q: "" }}
        />

        {categories.length > 0 && (
          <div>
            <p className="mb-2 text-data" style={{ color: "var(--fg-50)" }}>Categoría</p>
            <EventCategoryPills
              categories={categories}
              active={sp.categoria}
              activeFilters={activeFilters}
            />
          </div>
        )}
      </aside>

      <LocateMeInline />

      {events.length === 0 ? (
        <div
          className="mt-4 rounded-[12px] border p-10 text-center text-sm"
          style={{ borderColor: "var(--line)", background: "var(--card-bg)", color: "var(--fg-50)" }}
        >
          No hay eventos{hasFilters ? " con estos filtros" : " publicados todavía"}.{" "}
          {hasFilters ? (
            <Link href="/eventos" className="hover:underline" style={{ color: "var(--terra)" }}>
              Quitar filtros
            </Link>
          ) : (
            "Volvé pronto."
          )}
        </div>
      ) : (
        <div>
          {events.map((e) => {
            const d = distances.get(e.id);
            return (
              <EventCard
                key={e.id}
                event={e}
                {...(d !== undefined ? { distanceKm: d } : {})}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}

function EventCategoryPills({
  categories,
  active,
  activeFilters,
}: {
  categories: string[];
  active?: string | undefined;
  activeFilters: Record<string, string>;
}) {
  const buildHref = (cat?: string) => {
    const qs = new URLSearchParams({ ...activeFilters, categoria: "" });
    if (cat) qs.set("categoria", cat);
    const str = qs.toString().replace(/categoria=&?/, "").replace(/&$/, "");
    return str ? `/eventos?${str}` : "/eventos";
  };

  return (
    <nav aria-label="Categorías de eventos" className="flex flex-wrap gap-2">
      <Pill href={buildHref()} active={!active} label="Todos" />
      {categories.map((c) => (
        <Pill key={c} href={buildHref(c)} active={active === c} label={c} />
      ))}
    </nav>
  );
}

function Pill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border px-3 py-1 text-sm transition"
      style={
        active
          ? { background: "var(--terra)", borderColor: "var(--terra)", color: "#fff" }
          : { background: "var(--card-bg)", borderColor: "var(--line-2)", color: "var(--fg-70)" }
      }
    >
      {label}
    </Link>
  );
}
