import { createSupabaseCoreRepository } from "@haku/core";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const repo = createSupabaseCoreRepository(createAdminSupabase());
    await repo.incrementViewCount(slug);
  } catch (err) {
    console.error("[view-counter] Error incrementando view_count:", err);
  }
  return new Response(null, { status: 204 });
}
