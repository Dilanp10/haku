"use server";

import { z } from "zod";
import { createVenue, createSupabaseCoreRepository } from "@haku/core";
import { createServerSupabase } from "@/lib/supabase/server";

const schema = z.object({
  name:        z.string().trim().min(2, "El nombre es obligatorio").max(120),
  categorySlug:z.string().min(1, "Elegí una categoría"),
  address:     z.string().trim().max(240).optional(),
  description: z.string().trim().max(2000).optional(),
  phone:       z.string().trim().max(30).optional(),
  website:     z.string().trim().url("URL inválida").max(200).optional().or(z.literal("")),
  instagram:   z.string().trim().max(60).optional(),
});

/** Convierte un nombre a kebab-case válido para slug. */
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

export type SuggestState =
  | { status: "idle" }
  | { status: "success"; name: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

export async function suggestVenueAction(
  _prev: SuggestState,
  formData: FormData,
): Promise<SuggestState> {
  const raw = {
    name:         formData.get("name"),
    categorySlug: formData.get("categorySlug"),
    address:      formData.get("address") || undefined,
    description:  formData.get("description") || undefined,
    phone:        formData.get("phone") || undefined,
    website:      formData.get("website") || undefined,
    instagram:    formData.get("instagram") || undefined,
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Corregí los errores antes de enviar.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, categorySlug, address, description, phone, website, instagram } = parsed.data;
  const slug = `${toSlug(name)}-${randomSuffix()}`;

  // Usamos el cliente de servidor (anon + RLS). La política 0005 permite INSERT
  // con status='draft' para cualquier usuario. La categoría se resuelve vía FK
  // dentro del adapter (CategoryError si no existe).
  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);

  const res = await createVenue(repo, {
    slug,
    name,
    categorySlug,
    ...(address ? { address } : {}),
    ...(description ? { description } : {}),
    ...(phone ? { phone } : {}),
    ...(website ? { website } : {}),
    ...(instagram ? { instagram } : {}),
    status: "draft",
  });

  if (!res.ok) {
    return { status: "error", message: res.error.message };
  }

  return { status: "success", name };
}
