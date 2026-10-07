import {
  listVenues,
  listCategories,
  createSupabaseCoreRepository,
  type Category,
} from "@haku/core";
import { createServerSupabase } from "@/lib/supabase/server";
import { getVenueStatuses } from "@/lib/venue-open-now";
import { sortVenuesByOpenFirst } from "@/lib/sort-venues";
import { ExploreView } from "@/components/explore-map-client";
import type { ExplorePoint } from "@/components/explore-map";
import type { PlaceRowProps } from "@/components/place-row";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createServerSupabase();
  const coreRepo = createSupabaseCoreRepository(supabase);

  const [venuesRes, categoriesRes, statuses] = await Promise.all([
    listVenues(coreRepo, { pagination: { page: 1, pageSize: 100 } }),
    listCategories(coreRepo),
    getVenueStatuses(supabase),
  ]);

  let venues = venuesRes.ok ? venuesRes.value.items : [];
  const categories = categoriesRes.ok ? categoriesRes.value : [];
  const catById = new Map<string, Category>(categories.map((c) => [c.id, c]));

  venues = sortVenuesByOpenFirst(
    venues,
    (id) => statuses.open.has(id),
  );

  const points: ExplorePoint[] = venues
    .filter((v) => v.location !== null)
    .map((v) => ({
      slug: v.slug,
      name: v.name,
      lat: v.location!.lat,
      lng: v.location!.lng,
      imageUrl: v.coverImageUrl ?? null,
      open: statuses.open.has(v.id),
      closesAt: statuses.open.get(v.id)?.closesAt ?? null,
    }));

  const openVenues = venues.filter((v) => statuses.open.has(v.id));

  const rows: Omit<PlaceRowProps, "selected" | "onSelect">[] = openVenues.map((v) => {
    const cat = catById.get(v.categoryId);
    const openInfo = statuses.open.get(v.id);
    const closesAt = openInfo?.closesAt ?? null;

    let closingSoon = false;
    if (closesAt) {
      const parts = closesAt.split(":").map(Number);
      const h = parts[0] ?? 0;
      const m = parts[1] ?? 0;
      const now = new Date();
      const catNow = new Date(
        now.toLocaleString("en-US", { timeZone: "America/Argentina/Catamarca" }),
      );
      const closesMin = h * 60 + m;
      const nowMin = catNow.getHours() * 60 + catNow.getMinutes();
      const diff = closesMin - nowMin;
      closingSoon = diff > 0 && diff <= 60;
    }

    return {
      slug: v.slug,
      name: v.name,
      categoryName: cat?.name ?? null,
      neighborhood: v.neighborhood ?? null,
      closesAt,
      closingSoon,
      imageUrl: v.coverImageUrl ?? null,
    };
  });

  return (
    <main
      id="main"
      className="relative"
      style={{ height: "calc(100dvh - var(--bottom-nav-height, 72px))" }}
    >
      {/* On desktop, override to use full height minus top nav */}
      <style>{`@media (min-width: 768px) { #main { height: calc(100dvh - 57px) !important; } }`}</style>
      <ExploreView points={points} rows={rows} />
    </main>
  );
}
