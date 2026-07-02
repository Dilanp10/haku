"use server";

import { z } from "zod";
import { createVenue, createSupabaseCoreRepository } from "@haku/core";
import { createServerSupabase } from "@/lib/supabase/server";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_AUDIO_BYTES = 3 * 1024 * 1024; // 3MB
const PHOTO_MIME = ["image/jpeg", "image/png", "image/webp"];
const AUDIO_MIME = ["audio/webm", "audio/mpeg", "audio/mp4", "audio/ogg"];

const hoursItemSchema = z.object({
  day: z.number().int().min(0).max(6),
  opens: z.string().regex(/^\d{2}:\d{2}$/),
  closes: z.string().regex(/^\d{2}:\d{2}$/),
});

const schema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  categorySlug: z.string().optional(),
  address: z.string().trim().max(240).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  description: z.string().trim().max(2000).optional(),
  hours: z.array(hoursItemSchema).optional(),
});

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

async function uploadFile(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  file: File,
  path: string,
): Promise<string | null> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const up = await supabase.storage
    .from("venue-images")
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
  if (up.error) return null;
  const pub = supabase.storage.from("venue-images").getPublicUrl(path);
  return pub.data.publicUrl;
}

export type SuggestState =
  | { status: "idle" }
  | { status: "success"; name: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

export async function suggestVenueAction(
  _prev: SuggestState,
  formData: FormData,
): Promise<SuggestState> {
  // Parse hours JSON if present
  let hoursParsed: unknown = undefined;
  const hoursRaw = formData.get("hours");
  if (typeof hoursRaw === "string" && hoursRaw.length > 0) {
    try {
      hoursParsed = JSON.parse(hoursRaw);
    } catch {
      /* ignore */
    }
  }

  const raw = {
    name: formData.get("name"),
    categorySlug: (formData.get("categorySlug") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    lat: (formData.get("lat") as string) || undefined,
    lng: (formData.get("lng") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    hours: hoursParsed,
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Corregí los errores antes de enviar.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  // Requerido: nombre y ubicación (dirección o coords)
  const hasAddress = data.address && data.address.length > 0;
  const hasCoords = data.lat !== undefined && data.lng !== undefined;
  if (!hasAddress && !hasCoords) {
    return {
      status: "error",
      message: "Necesitamos saber dónde queda el lugar.",
      fieldErrors: { address: ["Ingresá una dirección o activá tu ubicación."] },
    };
  }

  const supabase = await createServerSupabase();
  const slug = `${toSlug(data.name)}-${randomSuffix()}`;

  // Uploads
  const photo = formData.get("photo") as File | null;
  const audio = formData.get("audio") as File | null;
  let coverImageUrl: string | undefined;
  let audioUrl: string | undefined;

  if (photo && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) {
      return { status: "error", message: "La foto es demasiado grande (máx 5MB)." };
    }
    if (!PHOTO_MIME.includes(photo.type)) {
      return { status: "error", message: "Formato de foto no soportado (jpg, png, webp)." };
    }
    const ext = photo.type.split("/")[1] ?? "jpg";
    const url = await uploadFile(
      supabase,
      photo,
      `suggestions/${slug}-${Date.now()}.${ext}`,
    );
    if (url) coverImageUrl = url;
  }

  if (audio && audio.size > 0) {
    if (audio.size > MAX_AUDIO_BYTES) {
      return { status: "error", message: "El audio es demasiado largo (máx 3MB)." };
    }
    if (!AUDIO_MIME.includes(audio.type)) {
      return { status: "error", message: "Formato de audio no soportado." };
    }
    const ext = audio.type.split("/")[1]?.replace(";", "") ?? "webm";
    const url = await uploadFile(
      supabase,
      audio,
      `suggestions/audio/${slug}-${Date.now()}.${ext}`,
    );
    if (url) audioUrl = url;
  }

  const repo = createSupabaseCoreRepository(supabase);
  const res = await createVenue(repo, {
    slug,
    name: data.name,
    // Si no eligió categoría, defaulteamos a "restaurante" para pasar la FK.
    // El admin la puede ajustar al aprobar.
    categorySlug: data.categorySlug ?? "restaurante",
    ...(data.address ? { address: data.address } : {}),
    ...(hasCoords
      ? { location: { lat: data.lat as number, lng: data.lng as number } }
      : {}),
    ...(data.description ? { description: data.description } : {}),
    ...(coverImageUrl ? { coverImageUrl } : {}),
    status: "draft",
  });

  if (!res.ok) {
    return { status: "error", message: res.error.message };
  }

  // Guardar horarios y audio como metadata en attributes JSONB del venue draft
  // (para que el admin los revise antes de materializarlos).
  const meta: Record<string, unknown> = {};
  if (audioUrl) meta["_audio_url"] = audioUrl;
  if (data.hours && data.hours.length > 0) meta["_hours"] = data.hours;
  if (Object.keys(meta).length > 0) {
    await supabase
      .from("venues")
      .update({ attributes: meta as Record<string, boolean> })
      .eq("slug", slug);
  }

  return { status: "success", name: data.name };
}
