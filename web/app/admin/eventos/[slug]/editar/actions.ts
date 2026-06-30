"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateEvent, createSupabaseEventRepository } from "@haku/events";
import { requireProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

export interface UpdateEventState {
  error?: string | undefined;
}

const opt = (v: FormDataEntryValue | null): string | null =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : null;

export async function updateEventAction(
  _prev: UpdateEventState,
  formData: FormData,
): Promise<UpdateEventState> {
  await requireProfile("admin");

  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "");

  const startsAtRaw = formData.get("startsAt");
  const endsAtRaw = formData.get("endsAt");

  const toIso = (v: FormDataEntryValue | null): string | null => {
    if (typeof v !== "string" || v.trim() === "") return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const startsAt = toIso(startsAtRaw);
  if (!startsAt) return { error: "Fecha de inicio invalida." };

  const input = {
    id,
    title: String(formData.get("title") ?? "").trim() || undefined,
    description: opt(formData.get("description")),
    startsAt,
    endsAt: toIso(endsAtRaw),
    venueName: opt(formData.get("venueName")),
    address: opt(formData.get("address")),
    url: opt(formData.get("url")),
    category: opt(formData.get("category")),
    status: String(formData.get("status") || "") as "pending" | "published" | "rejected" | "",
  };

  const supabase = await createServerSupabase();
  const repo = createSupabaseEventRepository(supabase);
  const res = await updateEvent(repo, {
    id: input.id,
    title: input.title,
    description: input.description,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    venueName: input.venueName,
    address: input.address,
    url: input.url ?? undefined,
    category: input.category,
    status: input.status || undefined,
  });

  if (!res.ok) return { error: res.error.message };

  revalidatePath("/eventos");
  revalidatePath(`/eventos/${slug}`);
  revalidatePath("/admin/eventos");

  redirect("/admin/eventos");
}
