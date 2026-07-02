import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/admin/lugares"
        className="inline-flex items-center gap-1 text-data transition-opacity hover:opacity-70"
        style={{ color: "var(--fg-50)" }}
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Volver
      </Link>
      <h1 className="mt-4 text-brand text-3xl" style={{ color: "var(--terra)" }}>
        Nuevo lugar
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--fg-50)" }}>
        Se guarda como borrador por defecto. Cambiá el estado a Publicado para que aparezca.
      </p>
      <div className="mt-8">
        <NewVenueForm categories={categories} foodTypes={foodTypes} />
      </div>
    </main>
  );
}
