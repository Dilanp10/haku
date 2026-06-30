import { notFound } from "next/navigation";
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
    <main className="container py-10">
      <h1 className="text-2xl font-bold">Editar: {venue.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        El <code>slug</code> no es editable. Cambia el estado a
        {" "}<span className="font-medium">Archivado</span> para ocultarlo del sitio público.
      </p>
      <div className="mt-8 max-w-2xl">
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
