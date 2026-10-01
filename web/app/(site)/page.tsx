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

export default async function HomePage({
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
  const coreRepo = createSupabaseCoreRepository(supabase);

  const pageSize = userLocation ? 50 : 20;

  const [filteredRes, totalRes, categoriesRes, foodTypesRes, statuses] =
    await Promise.all([
      listVenues(coreRepo, {
        ...(categorySlugs.length ? { categorySlugs } : {}),
        ...(priceRanges.length ? { priceRanges } : {}),
        ...(foodTypeSlugs.length ? { foodTypeSlugs } : {}),
        ...(attributes.length ? { attributes } : {}),
        ...(sp.q ? { search: sp.q } : {}),
        ...(isOpenNow ? { openNow: true } : {}),
        pagination: { page: 1, pageSize },
      }),
      listVenues(coreRepo, { pagination: { page: 1, pageSize: 1 } }),
      listCategories(coreRepo),
      listFoodTypes(coreRepo),
      getVenueStatuses(supabase),
    ]);

  let venues = filteredRes.ok ? filteredRes.value.items : [];
  const shownCount = filteredRes.ok ? filteredRes.value.total : 0;
  const totalVenues = totalRes.ok ? totalRes.value.total : 0;
  const openCount = statuses.open.size;
  const categories = categoriesRes.ok ? categoriesRes.value : [];
  const foodTypes = foodTypesRes.ok ? foodTypesRes.value : [];
  const catById = new Map<string, Category>(categories.map((c) => [c.id, c]));

  // Abiertos primero; con ubicación, distancia dentro de cada grupo (spec 031 O3)
  const distances = new Map<string, number>();
  if (userLocation) {
    for (const v of venues) {
      if (v.location) {
        distances.set(v.id, computeDistanceKm(userLocation, v.location));
      }
    }
  }
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
    <main id="main" className="mx-auto max-w-2xl md:max-w-5xl px-4 sm:px-6 pb-bottom">
      <header className="pt-8 pb-2">
        <p className="text-section mb-2">Catamarca · Ahora</p>
        <h1
          className="text-brand leading-none"
          style={{ fontSize: "clamp(3rem,12vw,4.5rem)", color: "var(--accent)" }}
        >
          Haku.
        </h1>
        <p className="mt-2 text-[15px]" style={{ color: "var(--fg-70)" }}>
          ¿Qué está abierto ahora?
        </p>

        <VenuesFilters
          categories={categories}
          foodTypes={foodTypes}
          basePath="/"
          compact
        />

        <LocateMeInline />
      </header>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-section" style={{ color: "var(--fg-50)" }}>
          {hasFilters ? `${shownCount} resultados` : `${totalVenues} lugares`}
        </p>
        <p className="text-section">
          <span style={{ color: "var(--success-fg)" }}>{openCount} abiertos</span>
          <span style={{ color: "var(--fg-30)" }}> · {totalVenues} total</span>
        </p>
      </div>

      <section className="pt-2">
        {venues.length > 0 ? (
          <div className="md:grid md:grid-cols-2 md:gap-x-8">
            {venues.map((v, i) => {
              const open = statuses.open.get(v.id);
              const known = statuses.knownIds.has(v.id);
              const dist = distances.get(v.id);
              return (
                <VenueCard
                  key={v.id}
                  venue={v}
                  category={catById.get(v.categoryId)}
                  priority={i < 2}
                  openNow={!!open}
                  {...(open?.closesAt ? { closesAt: open.closesAt } : {})}
                  closed={!open && known}
                  {...(dist !== undefined ? { distanceKm: dist } : {})}
                />
              );
            })}
          </div>
        ) : (
          <div
            className="mt-4 rounded-card border p-8 text-center text-sm"
            style={{ borderColor: "var(--line)", background: "var(--card-bg)", color: "var(--fg-50)" }}
          >
            No hay lugares con estos filtros.
          </div>
        )}
      </section>

    </main>
  );
}
