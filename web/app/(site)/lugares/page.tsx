import type { Metadata } from "next";
import Link from "next/link";
import {
  listVenues,
  listCategories,
  listFoodTypes,
  createSupabaseCoreRepository,
  distanceKm as computeDistanceKm,
  type Category,
} from "@haku/core";
import type { PriceRange } from "@haku/shared";
import { createServerSupabase } from "@/lib/supabase/server";
import { getVenueStatuses } from "@/lib/venue-open-now";
import { sortVenuesByOpenFirst } from "@/lib/sort-venues";
import { VenueCard } from "@/components/venue-card";
import { VenuesFilters } from "@/components/venues-filters";
import { LocateMeInline } from "@/components/locate-me-inline";

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

export const dynamic = "force-dynamic";

interface SearchParams {
  categoria?: string;
  precio?: string;
  comida?: string;
  attrs?: string;
  abierto?: string;
  q?: string;
  lat?: string;
  lng?: string;
  page?: string;
}

function parseList(v: string | undefined): string[] {
  if (!v) return [];
  return v.split(",").filter(Boolean);
}

const PRICE_VALUES: PriceRange[] = ["$", "$$", "$$$"];
function parsePrices(v: string | undefined): PriceRange[] {
  return parseList(v).filter((x): x is PriceRange =>
    PRICE_VALUES.includes(x as PriceRange),
  );
}

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const isOpenNow = sp.abierto === "1";
  const categorySlugs = parseList(sp.categoria);
  const foodTypeSlugs = parseList(sp.comida);
  const priceRanges = parsePrices(sp.precio);
  const attributes = parseList(sp.attrs);

  const lat = sp.lat !== undefined ? Number(sp.lat) : NaN;
  const lng = sp.lng !== undefined ? Number(sp.lng) : NaN;
  const userLocation =
    Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;

  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);
  const pageSize = userLocation ? 50 : 12;

  const [venuesRes, categoriesRes, foodTypesRes, statuses] = await Promise.all([
    listVenues(repo, {
      ...(categorySlugs.length ? { categorySlugs } : {}),
      ...(priceRanges.length ? { priceRanges } : {}),
      ...(foodTypeSlugs.length ? { foodTypeSlugs } : {}),
      ...(attributes.length ? { attributes } : {}),
      ...(sp.q ? { search: sp.q } : {}),
      ...(isOpenNow ? { openNow: true } : {}),
      pagination: { page: Number(sp.page ?? 1), pageSize },
    }),
    listCategories(repo),
    listFoodTypes(repo),
    getVenueStatuses(supabase),
  ]);

  if (!venuesRes.ok)
    return <ErrorBlock title="No pudimos cargar los lugares" detail={venuesRes.error.message} />;
  if (!categoriesRes.ok)
    return <ErrorBlock title="No pudimos cargar las categorías" detail={categoriesRes.error.message} />;

  let { items: venues } = venuesRes.value;
  const { total, page } = venuesRes.value;
  const categories = categoriesRes.value;
  const foodTypes = foodTypesRes.ok ? foodTypesRes.value : [];
  const byId = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const distances = new Map<string, number>();
  if (userLocation) {
    for (const v of venues) {
      if (v.location) distances.set(v.id, computeDistanceKm(userLocation, v.location));
    }
  }
  // Abiertos primero; distancia como criterio secundario (spec 031 O3)
  venues = sortVenuesByOpenFirst(
    venues,
    (id) => statuses.open.has(id),
    userLocation ? (id) => distances.get(id) : undefined,
  );

  const hasFilters =
    isOpenNow ||
    categorySlugs.length > 0 ||
    foodTypeSlugs.length > 0 ||
    priceRanges.length > 0 ||
    attributes.length > 0 ||
    !!sp.q;

  return (
    <main id="main" className="mx-auto max-w-2xl md:max-w-5xl px-4 py-8 pb-bottom">
      <header className="mb-6">
        <p className="text-section mb-1">Catamarca</p>
        <h1 className="text-brand text-3xl" style={{ color: "var(--fg)" }}>
          Lugares
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-50)" }}>
          {total} {total === 1 ? "lugar" : "lugares"}
          {hasFilters ? " con estos filtros" : " publicados"}.
        </p>
      </header>

      <VenuesFilters
        categories={categories}
        foodTypes={foodTypes}
        basePath="/lugares"
      />

      <LocateMeInline />

      <section className="pt-2">
        {venues.length === 0 ? (
          <div
            className="mt-4 rounded-[12px] border p-10 text-center text-sm"
            style={{ borderColor: "var(--line)", background: "var(--card-bg)", color: "var(--fg-50)" }}
          >
            Todavía no hay lugares con estos filtros.{" "}
            <Link href="/lugares" className="hover:underline" style={{ color: "var(--accent)" }}>
              Quitar filtros
            </Link>
          </div>
        ) : (
          <div className="md:grid md:grid-cols-2 md:gap-x-8">
            {venues.map((v, i) => {
              const open = statuses.open.get(v.id);
              const known = statuses.knownIds.has(v.id);
              const dist = distances.get(v.id);
              return (
                <VenueCard
                  key={v.id}
                  venue={v}
                  category={byId.get(v.categoryId)}
                  priority={i < 2}
                  openNow={!!open}
                  {...(open?.closesAt ? { closesAt: open.closesAt } : {})}
                  closed={!open && known}
                  {...(dist !== undefined ? { distanceKm: dist } : {})}
                />
              );
            })}
          </div>
        )}
      </section>

      {totalPages > 1 && !userLocation && (
        <nav className="mt-8 flex items-center justify-center gap-2 text-sm">
          <PageLink params={sp} page={page - 1} disabled={page <= 1} label="← Anterior" />
          <span className="text-data px-2" style={{ color: "var(--fg-50)" }}>
            Página {page} de {totalPages}
          </span>
          <PageLink params={sp} page={page + 1} disabled={page >= totalPages} label="Siguiente →" />
        </nav>
      )}
    </main>
  );
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
  if (disabled)
    return (
      <span
        className="rounded-[10px] border px-3 py-1.5"
        style={{ borderColor: "var(--line)", color: "var(--fg-30)" }}
      >
        {label}
      </span>
    );

  const qs = new URLSearchParams();
  if (params.categoria) qs.set("categoria", params.categoria);
  if (params.precio) qs.set("precio", params.precio);
  if (params.comida) qs.set("comida", params.comida);
  if (params.attrs) qs.set("attrs", params.attrs);
  if (params.q) qs.set("q", params.q);
  if (params.abierto) qs.set("abierto", params.abierto);
  qs.set("page", String(page));

  return (
    <Link
      href={`/lugares?${qs.toString()}`}
      className="rounded-[10px] border px-3 py-1.5 transition-opacity hover:opacity-70"
      style={{ borderColor: "var(--line-2)", color: "var(--fg)" }}
    >
      {label}
    </Link>
  );
}

function ErrorBlock({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-brand text-2xl" style={{ color: "var(--fg)" }}>{title}</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--fg-50)" }}>{detail}</p>
    </main>
  );
}
