"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const ratingSchema = z.number().int().min(1).max(5);

type RateResult = { ok: true; rating: number } | { ok: false; error: string };

export async function rateVenueAction(
  venueId: string,
  rating: number,
  slug: string,
): Promise<RateResult> {
  const parsed = ratingSchema.safeParse(rating);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_RATING" };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const { error } = await supabase.from("venue_ratings").upsert(
    {
      user_id: user.id,
      venue_id: venueId,
      rating: parsed.data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,venue_id" },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/lugares/${slug}`);
  return { ok: true, rating: parsed.data };
}

type ToggleResult =
  | { ok: true; saved: boolean }
  | { ok: false; error: string };

export async function toggleFavoriteAction(venueId: string): Promise<ToggleResult> {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const { data: existing } = await supabase
    .from("venue_saves")
    .select("venue_id")
    .eq("user_id", user.id)
    .eq("venue_id", venueId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("venue_saves")
      .delete()
      .eq("user_id", user.id)
      .eq("venue_id", venueId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/perfil/favoritos");
    return { ok: true, saved: false };
  } else {
    const { error } = await supabase
      .from("venue_saves")
      .insert({ user_id: user.id, venue_id: venueId });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/perfil/favoritos");
    return { ok: true, saved: true };
  }
}
