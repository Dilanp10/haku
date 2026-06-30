import type { Metadata } from "next";
import Link from "next/link";
import { LocateFixed, SlidersHorizontal, X } from "lucide-react";
import {
  listVenues,
  listCategories,
  listFoodTypes,
  createSupabaseCoreRepository,
  type Category,
} from "@haku/core";
import type { PriceRange } from "@haku/shared";
import { createServerSupabase } from "@/lib/supabase/server";
import { VenueCard } from "@/components/venue-card";
import { CategoryPills } from "@/components/category-pills";
import { PricePills } from "@/components/price-pills";
import { FoodTypePills } from "@/components/food-type-pills";
import { SearchInput } from "@/components/search-input";

export const metadata: Metadata = {
  title: "Lugares",
  description:
    "Bares, cafés y restaurantes de Catamarca para descubrir. Filtrá por categoría, precio y tipo de comida.",
  alternates: { canonical: "/lugares" },
  openGraph: {
    title: "Lugares · Haku",
    description: "Bares, cafés y restaurantes de Catamarca para descubrir.",
    url: "/lugares",
  },
};

export const revalidate = 300; // ISR 5 min

interface SearchParams {
  categoria?: string;
  precio?: string;
  comida?: string;
  q?: string;
  page?: string;
}

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);

  const [venuesRes, categoriesRes, foodTypesRes] = await Promise.all([
    listVenues(repo, {
      ...(sp.categoria ? { categorySlug: sp.categoria } : {}),
      ...(isPriceRange(sp.precio) ? { priceRange: sp.precio } : {}),
      ...(sp.comida ? { foodTypeSlug: sp.comida } : {}),
      ...(sp.q ? { search: sp.q } : {}),
      pagination: { page: Number(sp.page ?? 1), pageSize: 12 },
    }),
    listCategories(repo),
    listFoodTypes(repo),
  ]);

  if (!venuesRes.ok) return <ErrorBlock title="No pudimos cargar los lugares" detail={venuesRes.error.message} />;
  if (!categoriesRes.ok) return <ErrorBlock title="No pudimos cargar las categorías" detail={categoriesRes.error.message} />;

  const { items: venues, total, page, pageSize } = venuesRes.value;
  const categories = categoriesRes.value;
  const foodTypes = foodTypesRes.ok ? foodTypesRes.value : [];
  const byId = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Parámetros activos para preservar al paginar / cambiar un filtro sin resetear los demás.
  const activeFilters: Record<string, string> = {};
  if (sp.categoria) activeFilters["categoria"] = sp.categoria;
  if (sp.precio) activeFilters["precio"] = sp.precio;
  if (sp.comida) activeFilters["comida"] = sp.comida;
  if (sp.q) activeFilters["q"] = sp.q;

  const hasFilters = Object.keys(activeFilters).length > 0;

  return (
    <main id="main" className="container py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Catamarca</p>
          <h1 className="mt-1 text-3xl font-bold">Lugares</h1>
          <p className="mt-2 text-muted-foreground">
            {total} {total === 1 ? "lugar" : "lugares"}{hasFilters ? " con estos filtros" : " publicados"}.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/lugares/cerca"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition hover:border-primary/40"
          >
            <LocateFixed className="h-4 w-4" />
            Cerca tuyo
          </Link>
          <Link
            href="/lugares/sugerir"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            + Sugerir lugar
          </Link>
        </div>
      </header>

      {/* Filtros */}
      <aside className="mb-8 space-y-4 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
          </span>
          {hasFilters && (
            <Link
              href="/lugares"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Limpiar todo
            </Link>
          )}
        </div>

        {/* Búsqueda */}
        <SearchInput
          value={sp.q}
          placeholder="Buscar por nombre o descripción…"
          action="/lugares"
          preserveParams={{ ...activeFilters, q: "" }}
        />

        {/* Categoría */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Categoría</p>
          <CategoryPills
            categories={categories}
            active={sp.categoria}
            preserveParams={{ ...activeFilters, categoria: "" }}
          />
        </div>

        {/* Precio */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Precio</p>
          <PricePills
            active={sp.precio}
            basePath="/lugares"
            preserveParams={{ ...activeFilters, precio: "" }}
          />
        </div>

        {/* Tipo de comida */}
        {foodTypes.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Qué encontrás</p>
            <FoodTypePills
              foodTypes={foodTypes}
              active={sp.comida}
              basePath="/lugares"
              preserveParams={{ ...activeFilters, comida: "" }}
            />
          </div>
        )}
      </aside>

      <section>
        {venues.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <VenueCard key={v.id} venue={v} category={byId.get(v.categoryId)} />
            ))}
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2 text-sm">
          <PageLink params={sp} page={page - 1} disabled={page <= 1} label="← Anterior" />
          <span className="px-2 text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <PageLink params={sp} page={page + 1} disabled={page >= totalPages} label="Siguiente →" />
        </nav>
      )}
    </main>
  );
}

function isPriceRange(v: string | undefined): v is PriceRange {
  return v === "$" || v === "$$" || v === "$$$";
}

function PageLink({
  params,
  page,
  disabled,
  label,
}: {
  params: SearchParams;
  page: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) return <span className="rounded-md border px-3 py-1.5 text-muted-foreground/50">{label}</span>;
  const qs = new URLSearchParams();
  if (params.categoria) qs.set("categoria", params.categoria);
  if (params.precio) qs.set("precio", params.precio);
  if (params.comida) qs.set("comida", params.comida);
  if (params.q) qs.set("q", params.q);
  qs.set("page", String(page));
  return (
    <Link href={`/lugares?${qs.toString()}`} className="rounded-md border px-3 py-1.5 hover:border-primary/40">
      {label}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
      Todavía no hay lugares con estos filtros.{" "}
      <Link href="/lugares" className="text-primary hover:underline">
        Quitar filtros
      </Link>
    </div>
  );
}

function ErrorBlock({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="container py-10">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </main>
  );
}
