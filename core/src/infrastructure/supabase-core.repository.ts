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
} from "../application/ports/core-repository.port.js";
import { distanceKm, type Category, type FoodType, type Venue } from "../domain/venue.js";

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
    foodTypeIds: row.venue_food_types?.map((j) => j.food_type_id) ?? [],
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

      // Si hay filtro por food_type, resolvemos su id primero (evita join complejo).
      let foodTypeId: string | null = null;
      if (query.foodTypeSlug) {
        const ftRes = await client
          .from("food_types")
          .select("id")
          .eq("slug", query.foodTypeSlug)
          .maybeSingle();
        const ft = ftRes.data as { id: string } | null;
        if (!ft) return { items: [], total: 0, page, pageSize };
        foodTypeId = ft.id;
      }

      let q = client
        .from("venues")
        .select(
          foodTypeId
            ? "*, categories!inner(slug), venue_food_types!inner(food_type_id)"
            : "*, categories!inner(slug)",
          { count: "exact" },
        )
        .order("updated_at", { ascending: false })
        .range(from, to);

      if (query.categorySlug) q = q.eq("categories.slug", query.categorySlug);
      if (foodTypeId) q = q.eq("venue_food_types.food_type_id", foodTypeId);
      if (query.priceRange) q = q.eq("price_range", query.priceRange);
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
