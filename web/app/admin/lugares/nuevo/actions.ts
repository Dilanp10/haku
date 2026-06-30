"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseCoreRepository, createVenue } from "@haku/core";
import { ConflictError, ValidationError } from "@haku/shared";
import { requireProfile } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";

export interface CreateVenueState {
  error?: string;
}

export async function createVenueAction(
  _prev: CreateVenueState,
  formData: FormData,
): Promise<CreateVenueState> {
  await requireProfile("admin");

  const latRaw = formData.get("lat");
  const lngRaw = formData.get("lng");
  const lat = typeof latRaw === "string" && latRaw !== "" ? Number(latRaw) : undefined;
  const lng = typeof lngRaw === "string" && lngRaw !== "" ? Number(lngRaw) : undefined;

  const foodTypeIds = formData.getAll("foodTypeId").map(String).filter(Boolean);

  const slug = String(formData.get("slug") ?? "").trim();

  const adminClient = createAdminSupabase();

  // Cover image upload (optional)
  let coverImageUrl: string | undefined;
  const imageFile = formData.get("coverImage");
  if (imageFile instanceof File && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop() ?? "jpg";
    const path = `${slug}-${Date.now()}.${ext}`;
    const { error: uploadError } = await adminClient.storage
      .from("venue-images")
      .upload(path, imageFile, { upsert: true, contentType: imageFile.type });
    if (uploadError) return { error: `Error subiendo imagen: ${uploadError.message}` };
    const { data: urlData } = adminClient.storage.from("venue-images").getPublicUrl(path);
    coverImageUrl = urlData.publicUrl;
  }

  const input = {
    slug,
    name: String(formData.get("name") ?? "").trim(),
    description: optional(formData.get("description")),
    categorySlug: String(formData.get("categorySlug") ?? "").trim(),
    address: optional(formData.get("address")),
    location: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
    priceRange: optional(formData.get("priceRange")) as "$" | "$$" | "$$$" | undefined,
    phone: optional(formData.get("phone")),
    website: optional(formData.get("website")),
    instagram: optional(formData.get("instagram")),
    foodTypeIds: foodTypeIds.length > 0 ? foodTypeIds : undefined,
    status: (String(formData.get("status") ?? "draft") as "draft" | "published" | "archived"),
    ...(coverImageUrl ? { coverImageUrl } : {}),
  };

  const adminRepo = createSupabaseCoreRepository(adminClient);
  const res = await createVenue(adminRepo, input);

  if (!res.ok) {
    if (res.error instanceof ConflictError) {
      return { error: "Ya existe un lugar con ese slug. Elegí uno diferente." };
    }
    if (res.error instanceof ValidationError) {
      return { error: res.error.message };
    }
    return { error: "Error inesperado al crear el lugar." };
  }

  revalidatePath("/admin/lugares");
  revalidatePath("/lugares");
  redirect(`/admin/lugares/${res.value.slug}`);
}

function optional(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}
