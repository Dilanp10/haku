"use server";

import { revalidatePath } from "next/cache";
import {
  publishEvent,
  rejectEvent,
  createSupabaseEventRepository,
  runIngestion,
  type IngestionSummary,
} from "@haku/events";
import type { EventStatus } from "@haku/shared";
import { requireProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { buildSources, type SourceRow } from "@/lib/events/build-sources";

export async function publishEventAction(formData: FormData): Promise<void> {
  await requireProfile("admin");
  const id = String(formData.get("id") ?? "");
  const supabase = await createServerSupabase();
  const repo = createSupabaseEventRepository(supabase);
  const res = await publishEvent(repo, { id });
  if (!res.ok) throw new Error(res.error.message);
  revalidatePath("/eventos");
  revalidatePath("/admin/eventos");
}

export async function rejectEventAction(formData: FormData): Promise<void> {
  await requireProfile("admin");
  const id = String(formData.get("id") ?? "");
  const supabase = await createServerSupabase();
  const repo = createSupabaseEventRepository(supabase);
  const res = await rejectEvent(repo, { id });
  if (!res.ok) throw new Error(res.error.message);
  revalidatePath("/admin/eventos");
}

export async function quickEventStatusAction(formData: FormData): Promise<void> {
  await requireProfile("admin");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as EventStatus;
  const supabase = await createServerSupabase();
  const repo = createSupabaseEventRepository(supabase);
  await repo.updateStatus(id, status);
  revalidatePath("/eventos");
  revalidatePath("/admin/eventos");
}

export async function triggerIngestionAction(): Promise<IngestionSummary> {
  await requireProfile("admin");
  const adminClient = createAdminSupabase();
  const repo = createSupabaseEventRepository(adminClient);

  const sourcesRes = await adminClient
    .from("event_sources")
    .select("key, url, type, active, config")
    .eq("active", true);
  if (sourcesRes.error) {
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0, errors: [{ sourceKey: "db", message: sourcesRes.error.message }] };
  }

  const sources = buildSources((sourcesRes.data as unknown as SourceRow[]) ?? [], serverEnv.scraperUserAgent);
  const summary = await runIngestion({ sources, repo });

  const ranKeys = sources.map((s) => s.key);
  if (ranKeys.length > 0) {
    await adminClient
      .from("event_sources")
      .update({ last_run_at: new Date().toISOString() } as never)
      .in("key", ranKeys);
  }

  revalidatePath("/admin/eventos");
  revalidatePath("/eventos");
  return summary;
}
