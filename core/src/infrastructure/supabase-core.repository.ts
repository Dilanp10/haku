import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ConflictError,
  NotFoundError,
  type Database,
  type GeoPoint,
  type Tables,
} from "@haku/shared";

/**
 * Cliente Supabase con la `Database` de Haku.
 * Generics laxos en los argumentos posteriores (schema/postgrest) para tolerar las
 * variantes con que `@supabase/ssr` y `@supabase/supabase-js` materializan el tipo.
 */
type HakuSupabaseClient = SupabaseClient<Database, "public", any, any, any>;
import type {
  CoreRepository,
  CreateVenueData,
  ListVenuesQuery,
  Paginated,
  UpdateVenueData,
} from "../application/ports/core-repository.port";
import { distanceKm, type Category, type FoodType, type Venue } from "../domain/venue";
import { openStateAt, type OpeningRange } from "../domain/opening-hours";

type VenueRow = Tables<"venues"> & {
  venue_food_types?: { food_type_id: string }[] | null;
};

/** Mapea una fila de `venues` (con su join opcional de food_types) al dominio. */
function rowToVenue(row: VenueRow): Venue {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    address: row.address,
    location:
      row.lat !== null && row.lng !== null ? { lat: row.lat, lng: row.lng } : null,
    phone: row.phone,
    website: row.website,
    instagram: row.instagram,
    priceRange: row.price_range,
    coverImageUrl: row.cover_image_url,
    neighborhood: row.neighborhood,
    foodTypeIds: row.venue_food_types?.map((j) => j.food_type_id) ?? [],
    attributes: (row.attributes ?? {}) as Record<string, boolean>,
    status: row.status,
    viewCount: row.view_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Adapter Supabase del CoreRepository.
 * La RLS de Postgres garantiza que con la anon key solo se devuelvan venues `published`.
 */
export function createSupabaseCoreRepository(
  client: HakuSupabaseClient,
): CoreRepository {
  return {
    async listVenues(query: ListVenuesQuery): Promise<Paginated<Venue>> {
      const { page, pageSize } = query.pagination;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Si hay filtro por food_type (single o multi), resolvemos ids.
      const foodSlugs =
        query.foodTypeSlugs && query.foodTypeSlugs.length > 0
          ? query.foodTypeSlugs
          : query.foodTypeSlug
            ? [query.foodTypeSlug]
            : [];
      let foodTypeIds: string[] = [];
      if (foodSlugs.length > 0) {
        const ftRes = await client
          .from("food_types")
          .select("id")
          .in("slug", foodSlugs);
        if (ftRes.error) throw ftRes.error;
        const fts = (ftRes.data ?? []) as { id: string }[];
        if (fts.length === 0) return { items: [], total: 0, page, pageSize };
        foodTypeIds = fts.map((f) => f.id);
      }

      // "Abierto ahora": obtener IDs de venues abiertos, delegando el cálculo en el dominio.
      let openVenueIds: string[] | null = null;
      if (query.openNow) {
        const now = new Date();
        const argNow = new Date(
          now.toLocaleString("en-US", { timeZone: "America/Argentina/Catamarca" }),
        );

        const hoursRes = await client
          .from("venue_hours")
          .select("venue_id, day_of_week, opens_at, closes_at")
          .eq("day_of_week", argNow.getDay())
          .eq("closed", false);

        if (hoursRes.error) throw hoursRes.error;
        const rows = (hoursRes.data ?? []) as {
          venue_id: string;
          day_of_week: number;
          opens_at: string;
          closes_at: string;
        }[];

        const rangesByVenue = new Map<string, OpeningRange[]>();
        for (const r of rows) {
          const list = rangesByVenue.get(r.venue_id) ?? [];
          list.push({ day: r.day_of_week, opensAt: r.opens_at, closesAt: r.closes_at });
          rangesByVenue.set(r.venue_id, list);
        }

        const ids = new Set<string>();
        for (const [venueId, ranges] of rangesByVenue) {
          if (openStateAt(ranges, argNow).open) ids.add(venueId);
        }
        openVenueIds = [...ids];
        if (openVenueIds.length === 0) return { items: [], total: 0, page, pageSize };
      }

      let q = client
        .from("venues")
        .select(
          foodTypeIds.length > 0
            ? "*, categories!inner(slug), venue_food_types!inner(food_type_id)"
            : "*, categories!inner(slug)",
          { count: "exact" },
        )
        .order("updated_at", { ascending: false })
        .range(from, to);

      if (openVenueIds) q = q.in("id", openVenueIds);

      const catSlugs =
        query.categorySlugs && query.categorySlugs.length > 0
          ? query.categorySlugs
          : query.categorySlug
            ? [query.categorySlug]
            : [];
      if (catSlugs.length === 1) q = q.eq("categories.slug", catSlugs[0]!);
      else if (catSlugs.length > 1) q = q.in("categories.slug", catSlugs);

      if (foodTypeIds.length === 1) q = q.eq("venue_food_types.food_type_id", foodTypeIds[0]!);
      else if (foodTypeIds.length > 1) q = q.in("venue_food_types.food_type_id", foodTypeIds);

      const priceRanges =
        query.priceRanges && query.priceRanges.length > 0
          ? query.priceRanges
          : query.priceRange
            ? [query.priceRange]
            : [];
      if (priceRanges.length === 1) q = q.eq("price_range", priceRanges[0]!);
      else if (priceRanges.length > 1) q = q.in("price_range", priceRanges);

      if (query.attributes && query.attributes.length > 0) {
        // Cada atributo debe ser true: attributes @> '{"wifi":true, "terraza":true}'
        const attrsObj = Object.fromEntries(query.attributes.map((k) => [k, true]));
        q = q.contains("attributes", attrsObj);
      }

      if (query.status) q = q.eq("status", query.status);
      if (query.search) {
        const pattern = `%${query.search}%`;
        q = q.or(`name.ilike.${pattern},description.ilike.${pattern}`);
      }

      const res = await q;
      if (res.error) throw res.error;
      const rows = (res.data ?? []) as unknown as VenueRow[];
      return {
        items: rows.map(rowToVenue),
        total: res.count ?? 0,
        page,
        pageSize,
      };
    },

    async getVenueBySlug(slug: string): Promise<Venue | null> {
      const res = await client
        .from("venues")
        .select("*, venue_food_types(food_type_id)")
        .eq("slug", slug)
        .maybeSingle();
      if (res.error) throw res.error;
      return res.data ? rowToVenue(res.data as unknown as VenueRow) : null;
    },

    async searchVenuesNearby(point: GeoPoint, radiusKm: number, limit: number): Promise<Venue[]> {
      // Sin PostGIS: prefiltro por bounding box (lat ±dLat, lng ±dLng) y refinamos con haversine.
      const dLat = radiusKm / 111;
      const dLng = radiusKm / (111 * Math.cos((point.lat * Math.PI) / 180) || 1);

      const res = await client
        .from("venues")
        .select("*")
        .gte("lat", point.lat - dLat)
        .lte("lat", point.lat + dLat)
        .gte("lng", point.lng - dLng)
        .lte("lng", point.lng + dLng)
        .limit(limit * 4); // pedimos extra y filtramos por radio real
      if (res.error) throw res.error;

      const rows = (res.data ?? []) as unknown as VenueRow[];
      const venues = rows.map(rowToVenue);
      return venues
        .filter((v) => v.location && distanceKm(point, v.location) <= radiusKm)
        .sort((a, b) =>
          distanceKm(point, a.location!) - distanceKm(point, b.location!),
        )
        .slice(0, limit);
    },

    async listCategories(): Promise<Category[]> {
      const res = await client.from("categories").select("*").order("name");
      if (res.error) throw res.error;
      const rows = (res.data ?? []) as unknown as Tables<"categories">[];
      return rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        ...(r.icon !== null ? { icon: r.icon } : {}),
      }));
    },

    async listFoodTypes(): Promise<FoodType[]> {
      const res = await client.from("food_types").select("*").order("name");
      if (res.error) throw res.error;
      const rows = (res.data ?? []) as unknown as Tables<"food_types">[];
      return rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name }));
    },

    async createVenue(data: CreateVenueData): Promise<Venue> {
      // Resolver category_slug → category_id (FK).
      const catRes = await client
        .from("categories")
        .select("id")
        .eq("slug", data.categorySlug)
        .maybeSingle();
      const cat = catRes.data as { id: string } | null;
      if (!cat) throw new ConflictError(`Categoría '${data.categorySlug}' no existe`);

      const insertRes = await client
        .from("venues")
        .insert({
          slug: data.slug,
          name: data.name,
          description: data.description ?? null,
          category_id: cat.id,
          address: data.address ?? null,
          lat: data.location?.lat ?? null,
          lng: data.location?.lng ?? null,
          price_range: data.priceRange ?? null,
          phone: data.phone ?? null,
          website: data.website ?? null,
          instagram: data.instagram ?? null,
          cover_image_url: data.coverImageUrl ?? null,
          ...(data.attributes ? { attributes: data.attributes as Record<string, boolean> } : {}),
          status: data.status,
        })
        .select("*")
        .single();

      if (insertRes.error) {
        // 23505 = unique_violation (slug ya existe)
        if (insertRes.error.code === "23505") {
          throw new ConflictError(`Ya existe un lugar con slug '${data.slug}'`);
        }
        throw insertRes.error;
      }

      const venueId = (insertRes.data as unknown as { id: string }).id;
      if (data.foodTypeIds && data.foodTypeIds.length > 0) {
        const ftRes = await client.from("venue_food_types").insert(
          data.foodTypeIds.map((food_type_id) => ({ venue_id: venueId, food_type_id })),
        );
        if (ftRes.error) throw ftRes.error;
      }

      // Re-fetch con food types para el return consistente.
      const full = await client
        .from("venues")
        .select("*, venue_food_types(food_type_id)")
        .eq("id", venueId)
        .single();
      if (full.error) throw full.error;
      return rowToVenue(full.data as unknown as VenueRow);
    },

    async updateVenue(id: string, data: UpdateVenueData): Promise<Venue> {
      // Si vino categorySlug, resolverlo primero a category_id.
      let categoryId: string | undefined;
      if (data.categorySlug !== undefined) {
        const catRes = await client
          .from("categories")
          .select("id")
          .eq("slug", data.categorySlug)
          .maybeSingle();
        const cat = catRes.data as { id: string } | null;
        if (!cat) throw new ConflictError(`Categoría '${data.categorySlug}' no existe`);
        categoryId = cat.id;
      }

      // Construir patch parcial: solo incluir las claves que vinieron en `data`.
      const patch: Record<string, unknown> = {};
      if (data.name !== undefined) patch["name"] = data.name;
      if (data.description !== undefined) patch["description"] = data.description;
      if (categoryId !== undefined) patch["category_id"] = categoryId;
      if (data.address !== undefined) patch["address"] = data.address;
      if (data.location !== undefined) {
        patch["lat"] = data.location?.lat ?? null;
        patch["lng"] = data.location?.lng ?? null;
      }
      if (data.priceRange !== undefined) patch["price_range"] = data.priceRange;
      if (data.phone !== undefined) patch["phone"] = data.phone;
      if (data.website !== undefined) patch["website"] = data.website;
      if (data.instagram !== undefined) patch["instagram"] = data.instagram;
      if (data.coverImageUrl !== undefined) patch["cover_image_url"] = data.coverImageUrl;
      if (data.status !== undefined) patch["status"] = data.status;

      if (Object.keys(patch).length === 0 && data.foodTypeIds === undefined) {
        // No hay cambios: devolver la fila actual (no-op consistente).
        const cur = await client
          .from("venues")
          .select("*, venue_food_types(food_type_id)")
          .eq("id", id)
          .maybeSingle();
        if (cur.error) throw cur.error;
        if (!cur.data) throw new NotFoundError(`Venue ${id} no encontrado`);
        return rowToVenue(cur.data as unknown as VenueRow);
      }

      if (data.foodTypeIds !== undefined) {
        // Reemplazar todos los food types del venue (delete + insert).
        const delRes = await client.from("venue_food_types").delete().eq("venue_id", id);
        if (delRes.error) throw delRes.error;
        if (data.foodTypeIds.length > 0) {
          const insRes = await client.from("venue_food_types").insert(
            data.foodTypeIds.map((food_type_id) => ({ venue_id: id, food_type_id })),
          );
          if (insRes.error) throw insRes.error;
        }
      }

      if (Object.keys(patch).length === 0) {
        // Solo cambiaron food types: re-fetch el venue con el join actualizado.
        const cur = await client
          .from("venues")
          .select("*, venue_food_types(food_type_id)")
          .eq("id", id)
          .maybeSingle();
        if (cur.error) throw cur.error;
        if (!cur.data) throw new NotFoundError(`Venue ${id} no encontrado`);
        return rowToVenue(cur.data as unknown as VenueRow);
      }

      const res = await client
        .from("venues")
        .update(patch as never)
        .eq("id", id)
        .select("*, venue_food_types(food_type_id)")
        .maybeSingle();
      if (res.error) throw res.error;
      if (!res.data) throw new NotFoundError(`Venue ${id} no encontrado`);
      return rowToVenue(res.data as unknown as VenueRow);
    },

    async incrementViewCount(slug: string): Promise<void> {
      await client.rpc("increment_venue_views", { venue_slug: slug });
    },
  };
}
