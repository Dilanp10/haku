import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, SlidersHorizontal, X } from "lucide-react";
import {
  listUpcomingEvents,
  createSupabaseEventRepository,
} from "@haku/events";
import { createServerSupabase } from "@/lib/supabase/server";
import { EventCard } from "@/components/event-card";
import { SearchInput } from "@/components/search-input";

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

export const revalidate = 300;

interface SearchParams {
  q?: string;
  categoria?: string;
}

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createServerSupabase();
  const repo = createSupabaseEventRepository(supabase);

  const [eventsRes, categories] = await Promise.all([
    listUpcomingEvents(repo, {
      limit: 30,
      ...(sp.q ? { search: sp.q } : {}),
      ...(sp.categoria ? { category: sp.categoria } : {}),
    }),
    repo.listEventCategories(),
  ]);

  if (!eventsRes.ok) {
    return (
      <main className="container py-10">
        <h1 className="text-2xl font-bold">No pudimos cargar los eventos</h1>
        <p className="mt-2 text-sm text-muted-foreground">{eventsRes.error.message}</p>
      </main>
    );
  }

  const events = eventsRes.value;
  const hasFilters = !!(sp.q || sp.categoria);
  const activeFilters: Record<string, string> = {};
  if (sp.q) activeFilters["q"] = sp.q;
  if (sp.categoria) activeFilters["categoria"] = sp.categoria;

  return (
    <main id="main" className="container py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Catamarca</p>
          <h1 className="mt-1 text-3xl font-bold">Eventos</h1>
          <p className="mt-2 text-muted-foreground">
            {events.length} {events.length === 1 ? "evento" : "eventos"}{hasFilters ? " con estos filtros" : " próximos"}.
          </p>
        </div>
        <Link
          href="/eventos/cerca"
          className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
        >
          <MapPin className="h-4 w-4" />
          Cerca tuyo
        </Link>
      </header>

      {/* Filtros */}
      <aside className="mb-8 space-y-4 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
          </span>
          {hasFilters && (
            <Link
              href="/eventos"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
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
            <p className="mb-2 text-xs font-medium text-muted-foreground">Categoría</p>
            <CategoryPills categories={categories} active={sp.categoria} activeFilters={activeFilters} />
          </div>
        )}
      </aside>

      {events.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
          No hay eventos{hasFilters ? " con estos filtros" : " publicados todavía"}. {hasFilters ? (
            <Link href="/eventos" className="text-primary hover:underline">Quitar filtros</Link>
          ) : "Volvé pronto."}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </main>
  );
}

function CategoryPills({
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
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      {label}
    </Link>
  );
}
