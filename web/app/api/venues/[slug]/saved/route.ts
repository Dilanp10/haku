import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ saved: false });
  }

  // Resolver venue_id desde slug.
  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!venue) {
    return Response.json({ saved: false });
  }

  const { data: save } = await supabase
    .from("venue_saves")
    .select("venue_id")
    .eq("user_id", user.id)
    .eq("venue_id", venue.id)
    .maybeSingle();

  return Response.json({ saved: !!save });
}
