import type { MetadataRoute } from "next";
import {
  listVenues,
  createSupabaseCoreRepository,
} from "@haku/core";
import {
  listUpcomingEvents,
  createSupabaseEventRepository,
} from "@haku/events";
import { createServerSupabase } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Sitemap dinámico. Usa el cliente Supabase del request (anon + RLS) → solo
 * incluye contenido `published`, sin necesidad de bypass de seguridad.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.appUrl.replace(/\/+$/, "");
  const supabase = await createServerSupabase();
  const venueRepo = createSupabaseCoreRepository(supabase);
  const eventRepo = createSupabaseEventRepository(supabase);

  const [venuesRes, eventsRes] = await Promise.all([
    listVenues(venueRepo, { pagination: { page: 1, pageSize: 500 } }),
    listUpcomingEvents(eventRepo, { limit: 500 }),
  ]);

  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, priority: 1.0, changeFrequency: "weekly" },
    { url: `${base}/lugares`, lastModified: now, priority: 0.9, changeFrequency: "daily" },
    { url: `${base}/eventos`, lastModified: now, priority: 0.9, changeFrequency: "daily" },
  ];

  const venueEntries: MetadataRoute.Sitemap = venuesRes.ok
    ? venuesRes.value.items.map((v) => ({
        url: `${base}/lugares/${v.slug}`,
        lastModified: new Date(v.updatedAt),
        priority: 0.7,
        changeFrequency: "weekly" as const,
      }))
    : [];

  const eventEntries: MetadataRoute.Sitemap = eventsRes.ok
    ? eventsRes.value.map((e) => ({
        url: `${base}/eventos/${e.slug}`,
        lastModified: new Date(e.ingestedAt),
        priority: 0.6,
        changeFrequency: "daily" as const,
      }))
    : [];

  return [...staticEntries, ...venueEntries, ...eventEntries];
}
