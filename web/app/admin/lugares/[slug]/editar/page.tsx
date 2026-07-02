import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  getVenueBySlug,
  listCategories,
  listFoodTypes,
  createSupabaseCoreRepository,
} from "@haku/core";
import { requireProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { EditVenueForm } from "./edit-venue-form";

export const dynamic = "force-dynamic";

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireProfile("admin");
  const { slug } = await params;

  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);

  const [venueRes, categoriesRes, foodTypesRes] = await Promise.all([
    getVenueBySlug(repo, { slug }),
    listCategories(repo),
    listFoodTypes(repo),
  ]);

  if (!venueRes.ok) {
    if (venueRes.error.code === "NOT_FOUND") notFound();
    throw new Error(venueRes.error.message);
  }
  const venue = venueRes.value;
  const categories = categoriesRes.ok ? categoriesRes.value : [];
  const foodTypes = foodTypesRes.ok ? foodTypesRes.value : [];
  const currentCategory = categories.find((c) => c.id === venue.categoryId);

  const { data: hoursData } = await supabase
    .from("venue_hours")
    .select("day_of_week, opens_at, closes_at, closed")
    .eq("venue_id", venue.id)
    .order("day_of_week");
  const initialHours = hoursData ?? [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/admin/lugares"
        className="inline-flex items-center gap-1 text-data transition-opacity hover:opacity-70"
        style={{ color: "var(--fg-50)" }}
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Volver
      </Link>
      <h1 className="mt-4 text-brand text-3xl" style={{ color: "var(--terra)" }}>
        Editar: {venue.name}
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--fg-50)" }}>
        El <code>slug</code> no es editable. Cambiá el estado a Archivado para ocultarlo del sitio.
      </p>
      <div className="mt-8">
        <EditVenueForm
          venue={venue}
          categories={categories}
          foodTypes={foodTypes}
          currentCategorySlug={currentCategory?.slug}
          initialHours={initialHours}
        />
      </div>
    </main>
  );
}
