import { NextResponse } from "next/server";
import { runIngestion, createSupabaseEventRepository } from "@haku/events";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { env, serverEnv } from "@/lib/env";
import { sendAdminIngestionAlert } from "@/lib/email";
import { buildSources, type SourceRow } from "@/lib/events/build-sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Disparador de ingesta de eventos.
 * Auth: `Authorization: Bearer <EVENTS_INGEST_TOKEN>`.
 * Query opcional: `?source=<key>` para correr una sola fuente.
 */
export async function POST(req: Request): Promise<Response> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!serverEnv.ingestToken || token !== serverEnv.ingestToken) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const supabase = createAdminSupabase(); // service_role: bypass RLS para upsert
  const repo = createSupabaseEventRepository(supabase);

  // Cargar fuentes activas desde event_sources.
  const sourcesRes = await supabase
    .from("event_sources")
    .select("key, url, type, active, config")
    .eq("active", true);
  if (sourcesRes.error) {
    return NextResponse.json({ error: sourcesRes.error.message }, { status: 500 });
  }
  const sources = buildSources((sourcesRes.data as unknown as SourceRow[]) ?? [], serverEnv.scraperUserAgent);

  if (sources.length === 0) {
    return NextResponse.json(
      { fetched: 0, inserted: 0, updated: 0, skipped: 0, errors: [], note: "Sin fuentes activas" },
      { status: 200 },
    );
  }

  const sourceKey = new URL(req.url).searchParams.get("source") ?? undefined;
  const summary = await runIngestion({ sources, repo }, sourceKey);

  // Actualizar last_run_at de las fuentes que efectivamente corrieron.
  const ranKeys = sourceKey ? [sourceKey] : sources.map((s) => s.key);
  if (ranKeys.length > 0) {
    await supabase
      .from("event_sources")
      .update({ last_run_at: new Date().toISOString() } as never)
      .in("key", ranKeys);
  }

  if (summary.inserted > 0) {
    await sendAdminIngestionAlert(summary, env.appUrl);
  }

  return NextResponse.json(summary, { status: 200 });
}
