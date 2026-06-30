import { listCategories, listFoodTypes, createSupabaseCoreRepository } from "@haku/core";
import { requireProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { NewVenueForm } from "./new-venue-form";

export const dynamic = "force-dynamic";

export default async function NewVenuePage() {
  await requireProfile("admin");

  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);

  const [categoriesRes, foodTypesRes] = await Promise.all([
    listCategories(repo),
    listFoodTypes(repo),
  ]);
  const categories = categoriesRes.ok ? categoriesRes.value : [];
  const foodTypes = foodTypesRes.ok ? foodTypesRes.value : [];

  return (
    <main className="container py-10">
      <h1 className="text-2xl font-bold">Nuevo lugar</h1>
      <p className="mt-1 text-muted-foreground">
        Se guarda como borrador por defecto. Cambia el estado a Publicado para que aparezca.
      </p>
      <div className="mt-8 max-w-2xl">
        <NewVenueForm categories={categories} foodTypes={foodTypes} />
      </div>
    </main>
  );
}
