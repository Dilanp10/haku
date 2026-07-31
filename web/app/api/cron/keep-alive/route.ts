import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabase();
  const { error } = await supabase.from("profiles").select("id").limit(1);

  if (error) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "alive", timestamp: new Date().toISOString() });
}
