import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listCategories, createSupabaseCoreRepository } from "@haku/core";
import { createServerSupabase } from "@/lib/supabase/server";
import { SuggestForm } from "./suggest-form";

export const metadata: Metadata = {
  title: "Sugerir un lugar",
  description:
    "Conocés un bar, café o restaurante de Catamarca que debería estar en Haku? Contanos y lo revisamos.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function SuggestPage() {
  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);
  const categoriesRes = await listCategories(repo);
  const categories = categoriesRes.ok ? categoriesRes.value : [];

  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-8 pb-bottom">
      <Link
        href="/lugares"
        className="inline-flex items-center gap-1 text-data transition-opacity hover:opacity-70"
        style={{ color: "var(--fg-50)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Todos los lugares
      </Link>

      <header className="mt-4 mb-8">
        <p className="text-section mb-1">Comunidad</p>
        <h1 className="text-brand text-3xl" style={{ color: "var(--fg)" }}>
          Sugerir un lugar
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-50)" }}>
          ¿Conocés un lugar de Catamarca que debería estar en Haku?
        </p>
      </header>

      <SuggestForm categories={categories} />
    </main>
  );
}
