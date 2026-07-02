"use server";

import { revalidatePath } from "next/cache";
import { updateVenue, createSupabaseCoreRepository } from "@haku/core";
import { requireProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

export async function quickStatusAction(formData: FormData) {
  await requireProfile("admin");
  const id     = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as "draft" | "published" | "archived";
  const slug   = String(formData.get("slug") ?? "");

  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);
  await updateVenue(repo, { id, status });

  revalidatePath("/admin/lugares");
  revalidatePath("/lugares");
  if (slug) revalidatePath(`/lugares/${slug}`);
  if (slug) revalidatePath(`/admin/lugares/${slug}`);
}

interface SuggestedHour {
  day: number;
  opens: string;
  closes: string;
}

/**
 * Materializa los horarios sugeridos (guardados en venues.attributes._hours por el wizard)
 * en la tabla venue_hours. Reemplaza los horarios existentes del venue y limpia la metadata
 * _hours / _audio_url de attributes.
 */
export async function approveSuggestedHoursAction(formData: FormData) {
  await requireProfile("admin");
  const venueId = String(formData.get("venueId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!venueId) return;

  const supabase = await createServerSupabase();

  const { data: venue } = await supabase
    .from("venues")
    .select("attributes")
    .eq("id", venueId)
    .maybeSingle();

  const attrs = ((venue?.attributes ?? {}) as Record<string, unknown>) || {};
  const suggested = Array.isArray(attrs["_hours"])
    ? (attrs["_hours"] as SuggestedHour[])
    : [];

  if (suggested.length > 0) {
    // Reemplazar horarios existentes
    await supabase.from("venue_hours").delete().eq("venue_id", venueId);
    const rows = suggested
      .filter(
        (h) =>
          typeof h.day === "number" &&
          /^\d{2}:\d{2}$/.test(h.opens) &&
          /^\d{2}:\d{2}$/.test(h.closes),
      )
      .map((h) => ({
        venue_id: venueId,
        day_of_week: h.day,
        opens_at: h.opens,
        closes_at: h.closes,
        closed: false,
      }));
    if (rows.length > 0) {
      await supabase.from("venue_hours").insert(rows);
    }
  }

  // Limpiar la metadata del wizard (mantener el resto de attributes)
  const cleaned: Record<string, unknown> = { ...attrs };
  delete cleaned["_hours"];
  delete cleaned["_audio_url"];
  await supabase
    .from("venues")
    .update({ attributes: cleaned as Record<string, boolean> })
    .eq("id", venueId);

  revalidatePath("/admin/lugares");
  if (slug) revalidatePath(`/admin/lugares/${slug}`);
  if (slug) revalidatePath(`/lugares/${slug}`);
}

type GeocodeResult =
  | { ok: true; lat: number; lng: number; display: string }
  | { ok: false; error: string };

/**
 * Geocodifica la dirección del venue con Nominatim (OpenStreetMap) y guarda lat/lng.
 * Uso admin, un lugar por vez (respeta el límite de 1 req/s de Nominatim).
 */
export async function geocodeVenueAction(formData: FormData): Promise<GeocodeResult> {
  await requireProfile("admin");
  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  if (!id || !address) return { ok: false, error: "Falta la dirección." };

  // Sesgamos a Catamarca, Argentina si no está en el texto.
  const query = /catamarca/i.test(address)
    ? address
    : `${address}, San Fernando del Valle de Catamarca, Argentina`;

  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&q=" +
    encodeURIComponent(query);

  let json: Array<{ lat: string; lon: string; display_name: string }> = [];
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Haku/1.0 (https://haku20.vercel.app; admin@haku.app)",
        "Accept-Language": "es",
      },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: `Nominatim respondió ${res.status}.` };
    json = (await res.json()) as typeof json;
  } catch {
    return { ok: false, error: "No pudimos contactar el servicio de geocodificación." };
  }

  const hit = json[0];
  if (!hit) return { ok: false, error: "No encontramos esa dirección. Revisala o cargá lat/lng a mano." };

  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, error: "Coordenadas inválidas." };
  }

  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);
  const upd = await updateVenue(repo, { id, location: { lat, lng } });
  if (!upd.ok) return { ok: false, error: upd.error.message };

  revalidatePath("/admin/lugares");
  if (slug) revalidatePath(`/admin/lugares/${slug}`);
  if (slug) revalidatePath(`/lugares/${slug}`);
  return { ok: true, lat, lng, display: hit.display_name };
}

/** Descarta solo la metadata del wizard sin materializar horarios. */
export async function dismissSuggestionMetaAction(formData: FormData) {
  await requireProfile("admin");
  const venueId = String(formData.get("venueId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!venueId) return;

  const supabase = await createServerSupabase();
  const { data: venue } = await supabase
    .from("venues")
    .select("attributes")
    .eq("id", venueId)
    .maybeSingle();

  const attrs = ((venue?.attributes ?? {}) as Record<string, unknown>) || {};
  const cleaned: Record<string, unknown> = { ...attrs };
  delete cleaned["_hours"];
  delete cleaned["_audio_url"];
  await supabase
    .from("venues")
    .update({ attributes: cleaned as Record<string, boolean> })
    .eq("id", venueId);

  revalidatePath("/admin/lugares");
  if (slug) revalidatePath(`/admin/lugares/${slug}`);
}
