import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listCategories, createSupabaseCoreRepository } from "@haku/core";
import { createServerSupabase } from "@/lib/supabase/server";
import { SuggestForm } from "./suggest-form";

export const metadata: Metadata = {
  title: "Sugerir un lugar",
  description: "Conocés un bar, café o restaurante de Catamarca que debería estar en Haku? Contanos y lo revisamos.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function SuggestPage() {
  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);
  const categoriesRes = await listCategories(repo);
  const categories = categoriesRes.ok ? categoriesRes.value : [];

  return (
    <main id="main" className="container max-w-2xl py-10">
      <Link
        href="/lugares"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Volver a Lugares
      </Link>

      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">Comunidad</p>
        <h1 className="mt-1 text-3xl font-bold">Sugerir un lugar</h1>
        <p className="mt-2 text-muted-foreground">
          ¿Conocés un bar, café o restaurante de Catamarca que debería estar en Haku?
          Completá el formulario y lo revisamos. Los campos marcados con <span className="font-medium">*</span> son
          obligatorios; el resto nos ayuda a enriquecer la ficha.
        </p>
      </header>

      <div className="rounded-lg border bg-card p-6">
        <SuggestForm categories={categories} />
      </div>
    </main>
  );
}
