import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import type { Venue, Category } from "@haku/core";
import { listCategories, createSupabaseCoreRepository } from "@haku/core";
import { getCurrentProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getVenueStatuses } from "@/lib/venue-open-now";
import { sortVenuesByOpenFirst } from "@/lib/sort-venues";
import { VenueCard } from "@/components/venue-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mis favoritos",
  robots: { index: false },
};

interface VenueRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string;
  address: string | null;
  cover_image_url: string | null;
  neighborhood: string | null;
}

interface SaveRow {
  venue_id: string;
  created_at: string;
  venues: VenueRow | null;
}

/** Mapea la fila mínima de favoritos a la forma que consume VenueCard. */
function toCardVenue(row: VenueRow): Venue {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    address: row.address,
    location: null,
    coverImageUrl: row.cover_image_url,
    neighborhood: row.neighborhood,
    foodTypeIds: [],
    status: "published",
    viewCount: 0,
    createdAt: "",
    updatedAt: "",
  };
}

export default async function FavoritosPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?from=/perfil/favoritos");

  const supabase = await createServerSupabase();
  const coreRepo = createSupabaseCoreRepository(supabase);

  const [{ data }, categoriesRes, statuses] = await Promise.all([
    supabase
      .from("venue_saves")
      .select(
        "venue_id, created_at, venues(id, slug, name, description, category_id, address, cover_image_url, neighborhood)",
      )
      .order("created_at", { ascending: false }),
    listCategories(coreRepo),
    getVenueStatuses(supabase),
  ]);

  const saves = (data ?? []) as unknown as SaveRow[];
  const categories = categoriesRes.ok ? categoriesRes.value : [];
  const catById = new Map<string, Category>(categories.map((c) => [c.id, c]));

  // Abiertos primero (spec 031 O3)
  const venues = sortVenuesByOpenFirst(
    saves
      .map((s) => s.venues)
      .filter((v): v is VenueRow => v !== null)
      .map(toCardVenue),
    (id) => statuses.open.has(id),
  );

  return (
    <main id="main" className="mx-auto max-w-2xl md:max-w-5xl px-4 py-8 pb-bottom">
      <header className="mb-6 flex items-center gap-3">
        <Heart className="h-5 w-5" style={{ color: "var(--rust)" }} fill="currentColor" />
        <h1 className="text-brand text-2xl" style={{ color: "var(--fg)" }}>
          Mis favoritos
        </h1>
      </header>

      {venues.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 rounded-[12px] border py-16 text-center"
          style={{ borderColor: "var(--line)", background: "var(--card-bg)" }}
        >
          <Heart className="h-12 w-12" style={{ color: "var(--fg-30)" }} />
          <p style={{ color: "var(--fg-50)" }}>Todavía no guardaste ningún lugar.</p>
          <Link
            href="/lugares"
            className="rounded-[10px] px-4 py-2 text-sm font-medium transition active:opacity-80"
            style={{ background: "var(--terra)", color: "#fff" }}
          >
            Descubrí lugares
          </Link>
        </div>
      ) : (
        <div className="md:grid md:grid-cols-2 md:gap-x-8">
          {venues.map((venue, i) => {
            const open = statuses.open.get(venue.id);
            const known = statuses.knownIds.has(venue.id);
            return (
              <VenueCard
                key={venue.id}
                venue={venue}
                category={catById.get(venue.categoryId)}
                priority={i < 2}
                openNow={!!open}
                {...(open?.closesAt ? { closesAt: open.closesAt } : {})}
                closed={!open && known}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
