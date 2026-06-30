"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  updateVenue,
  createSupabaseCoreRepository,
  type UpdateVenueData,
} from "@haku/core";
import { requireProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export interface UpdateVenueState {
  error?: string;
}

/**
 * Server Action de edición. Construye el patch parcial leyendo FormData:
 * - "" en un input opcional → no se cambia (undefined).
 * - "__clear__" → null (limpia el campo) — usable en el form como sentinel si hace falta.
 */
export async function updateVenueAction(
  _prev: UpdateVenueState,
  formData: FormData,
): Promise<UpdateVenueState> {
  await requireProfile("admin");

  const id = String(formData.get("id") ?? "");
  const newSlug = String(formData.get("slug") ?? ""); // solo para redirect; no mutable

  const data: UpdateVenueData = {};
  const name = strField(formData.get("name"));
  if (name !== undefined) data.name = name;

  const description = nullableStrField(formData.get("description"));
  if (description !== undefined) data.description = description;

  const categorySlug = strField(formData.get("categorySlug"));
  if (categorySlug !== undefined) data.categorySlug = categorySlug;

  const address = nullableStrField(formData.get("address"));
  if (address !== undefined) data.address = address;

  const lat = numField(formData.get("lat"));
  const lng = numField(formData.get("lng"));
  if (lat !== undefined && lng !== undefined) data.location = { lat, lng };
  else if (formData.has("lat") && formData.has("lng") && lat === undefined && lng === undefined)
    data.location = null;

  const priceRange = strField(formData.get("priceRange"));
  if (priceRange === "") data.priceRange = null;
  else if (priceRange) data.priceRange = priceRange as "$" | "$$" | "$$$";

  const phone = nullableStrField(formData.get("phone"));
  if (phone !== undefined) data.phone = phone;

  const website = nullableStrField(formData.get("website"));
  if (website !== undefined) data.website = website;

  const instagram = nullableStrField(formData.get("instagram"));
  if (instagram !== undefined) data.instagram = instagram;

  // Cover image: subir archivo si vino uno; limpiar si viene "__clear__"; si no, sin cambios.
  const imageFile = formData.get("coverImage");
  const clearImage = formData.get("clearCoverImage") === "1";
  if (clearImage) {
    data.coverImageUrl = null;
  } else if (imageFile instanceof File && imageFile.size > 0) {
    const adminClient = createAdminSupabase();
    const ext = imageFile.name.split(".").pop() ?? "jpg";
    const path = `${id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await adminClient.storage
      .from("venue-images")
      .upload(path, imageFile, { upsert: true, contentType: imageFile.type });
    if (uploadError) return { error: `Error subiendo imagen: ${uploadError.message}` };
    const { data: urlData } = adminClient.storage.from("venue-images").getPublicUrl(path);
    data.coverImageUrl = urlData.publicUrl;
  }

  // Checkboxes: siempre presente en el formulario (puede ser array vacío si ninguno marcado).
  // FormData envía múltiples valores con el mismo name cuando hay varios checked.
  const rawFoodTypeIds = formData.getAll("foodTypeId").map(String).filter(Boolean);
  data.foodTypeIds = rawFoodTypeIds;

  const status = strField(formData.get("status"));
  if (status) data.status = status as "draft" | "published" | "archived";

  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);
  const res = await updateVenue(repo, { id, ...data });
  if (!res.ok) return { error: res.error.message };

  // Horarios: reemplazo completo (DELETE + INSERT) via service_role.
  const hoursRows: {
    venue_id: string;
    day_of_week: number;
    opens_at: string;
    closes_at: string;
    closed: boolean;
  }[] = [];

  for (let i = 0; i < 7; i++) {
    const day = Number(formData.get(`hours[${i}][day]`) ?? i);
    const opens = String(formData.get(`hours[${i}][opens_at]`) ?? "").trim();
    const closes = String(formData.get(`hours[${i}][closes_at]`) ?? "").trim();
    const closed = formData.get(`hours[${i}][closed]`) === "on";

    if (closed) {
      hoursRows.push({ venue_id: id, day_of_week: day, opens_at: "00:00", closes_at: "00:01", closed: true });
    } else if (opens && closes) {
      if (closes <= opens) {
        return { error: `Horario del ${["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][day]}: el cierre debe ser posterior a la apertura.` };
      }
      hoursRows.push({ venue_id: id, day_of_week: day, opens_at: opens, closes_at: closes, closed: false });
    }
  }

  const adminClient = createAdminSupabase();
  await adminClient.from("venue_hours").delete().eq("venue_id", id);
  if (hoursRows.length > 0) {
    const { error: insertErr } = await adminClient.from("venue_hours").insert(hoursRows);
    if (insertErr) return { error: `Error guardando horarios: ${insertErr.message}` };
  }

  revalidatePath("/lugares");
  revalidatePath(`/lugares/${res.value.slug}`);
  // Si el venue ya no está publicado, llevarlo al listado admin.
  if (res.value.status !== "published") redirect("/admin/lugares");
  redirect(`/lugares/${newSlug || res.value.slug}`);
}

function strField(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}
function nullableStrField(v: FormDataEntryValue | null): string | null | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  if (t === "") return null; // explícitamente vacío = limpiar
  return t;
}
function numField(v: FormDataEntryValue | null): number | undefined {
  if (typeof v !== "string" || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
