import Link from "next/link";
import { ChevronLeft, ChevronRight, Volume2, Clock } from "lucide-react";
import {
  listVenues,
  listCategories,
  createSupabaseCoreRepository,
  type Category,
} from "@haku/core";
import { requireProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CATEGORY_EMOJI: Record<string, string> = {
  cafeteria: "☕",
  restaurante: "🍽️",
  bar: "🍺",
  heladeria: "🍦",
  panaderia: "🥐",
  pizzeria: "🍕",
  parrilla: "🥩",
  cerveceria: "🍻",
};

export default async function AdminSugerenciasPage() {
  await requireProfile("admin");
  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);

  const [draftsRes, categoriesRes] = await Promise.all([
    listVenues(repo, { status: "draft", pagination: { page: 1, pageSize: 100 } }),
    listCategories(repo),
  ]);

  const drafts = draftsRes.ok ? draftsRes.value.items : [];
  const categories = categoriesRes.ok ? categoriesRes.value : [];
  const catById = new Map<string, Category>(categories.map((c) => [c.id, c]));

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/admin/lugares"
        className="inline-flex items-center gap-1 text-data transition-opacity hover:opacity-70"
        style={{ color: "var(--fg-50)" }}
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Volver al admin
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="text-brand text-3xl" style={{ color: "var(--terra)" }}>
          Sugerencias
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-50)" }}>
          {drafts.length} {drafts.length === 1 ? "pendiente" : "pendientes"} de revisar
        </p>
      </header>

      {drafts.length === 0 ? (
        <div
          className="rounded-[12px] border p-10 text-center text-sm"
          style={{ borderColor: "var(--line)", background: "var(--card-bg)", color: "var(--fg-50)" }}
        >
          No hay sugerencias pendientes.
        </div>
      ) : (
        <ul className="space-y-3">
          {drafts.map((v) => {
            const cat = catById.get(v.categoryId);
            const attrs = (v.attributes ?? {}) as Record<string, unknown>;
            const hasHours = Array.isArray(attrs["_hours"]);
            const hasAudio = typeof attrs["_audio_url"] === "string";
            const where = [v.address, v.neighborhood].filter(Boolean).join(", ");
            return (
              <li key={v.id}>
                <Link
                  href={`/admin/lugares/${v.slug}`}
                  className="block rounded-[12px] border p-4 transition active:opacity-80"
                  style={{ borderColor: "var(--line-2)", background: "var(--card-bg)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-brand text-lg leading-tight" style={{ color: "var(--fg)" }}>
                        {v.name}
                      </p>
                      <p className="mt-0.5 text-sm" style={{ color: "var(--fg-50)" }}>
                        {cat ? `${CATEGORY_EMOJI[cat.slug] ?? "•"} ${cat.name}` : "— sin categoría —"}
                        {where ? ` · ${where}` : ""}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--fg-30)" }} />
                  </div>

                  {(hasHours || hasAudio) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {hasAudio && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                          style={{ background: "var(--terra-wash)", color: "var(--terra)" }}
                        >
                          <Volume2 className="h-3 w-3" /> Audio
                        </span>
                      )}
                      {hasHours && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                          style={{ background: "var(--terra-wash)", color: "var(--terra)" }}
                        >
                          <Clock className="h-3 w-3" /> Horarios sugeridos
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
