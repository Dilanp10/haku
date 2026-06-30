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
