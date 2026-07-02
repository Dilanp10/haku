import Link from "next/link";
import { Plus, Inbox } from "lucide-react";
import {
  listVenues,
  listCategories,
  createSupabaseCoreRepository,
  type Category,
  type Venue,
} from "@haku/core";
import { requireProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { QuickStatusBtn } from "./quick-status-btn";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<Venue["status"], string> = {
  draft: "Borrador",
  published: "Activo",
  archived: "Archivado",
};

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

type StatusFilter = "draft" | "published" | "archived" | undefined;

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: undefined, label: "Todos" },
  { value: "draft", label: "Borradores" },
  { value: "published", label: "Activos" },
  { value: "archived", label: "Archivados" },
];

function statusColor(s: Venue["status"]): string {
  if (s === "published") return "var(--moss)";
  if (s === "archived") return "var(--rust)";
  return "var(--fg-50)";
}

export default async function AdminLugaresPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  await requireProfile("admin");
  const { estado } = await searchParams;
  const statusFilter = (["draft", "published", "archived"].includes(estado ?? "")
    ? (estado as Venue["status"])
    : undefined);

  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);

  const [venuesRes, categoriesRes, draftsRes] = await Promise.all([
    listVenues(repo, {
      pagination: { page: 1, pageSize: 100 },
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
    listCategories(repo),
    listVenues(repo, { status: "draft", pagination: { page: 1, pageSize: 1 } }),
  ]);
  if (!venuesRes.ok) throw new Error(venuesRes.error.message);

  const categories = categoriesRes.ok ? categoriesRes.value : [];
  const catById = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const venues = venuesRes.value.items;
  const total = venuesRes.value.total;
  const draftCount = draftsRes.ok ? draftsRes.value.total : 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-brand text-3xl" style={{ color: "var(--terra)" }}>
            Admin
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-50)" }}>
            {total} {total === 1 ? "lugar cargado" : "lugares cargados"}
          </p>
        </div>
      </header>

      {/* Acciones */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/admin/lugares/nuevo"
          className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium transition active:opacity-80"
          style={{ background: "var(--terra)", color: "#fff" }}
        >
          <Plus className="h-4 w-4" /> Nuevo lugar
        </Link>
        <Link
          href="/admin/lugares/sugerencias"
          className="relative inline-flex items-center gap-2 rounded-[10px] border px-4 py-2 text-sm font-medium transition active:opacity-80"
          style={{ borderColor: "var(--line-2)", color: "var(--fg)" }}
        >
          <Inbox className="h-4 w-4" /> Sugerencias
          {draftCount > 0 && (
            <span
              className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold"
              style={{ background: "var(--terra)", color: "#fff" }}
            >
              {draftCount}
            </span>
          )}
        </Link>
      </div>

      {/* Filtro por estado */}
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Filtrar por estado">
        {FILTER_OPTIONS.map(({ value, label }) => {
          const href = value ? `/admin/lugares?estado=${value}` : "/admin/lugares";
          const active = statusFilter === value;
          return (
            <Link
              key={label}
              href={href}
              className="rounded-full border px-3 py-1 text-sm transition"
              style={
                active
                  ? { background: "var(--terra)", borderColor: "var(--terra)", color: "#fff" }
                  : { background: "var(--card-bg)", borderColor: "var(--line-2)", color: "var(--fg-70)" }
              }
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Tabla */}
      {venues.length === 0 ? (
        <div
          className="rounded-[12px] border p-10 text-center text-sm"
          style={{ borderColor: "var(--line)", background: "var(--card-bg)", color: "var(--fg-50)" }}
        >
          No hay lugares con este filtro.
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-[12px] border"
          style={{ borderColor: "var(--line)", background: "var(--card-bg)" }}
        >
          {/* Head */}
          <div
            className="hidden sm:grid grid-cols-[1fr_180px_180px_90px] gap-4 px-5 py-3 text-data uppercase"
            style={{ color: "var(--fg-50)", borderBottom: "1px solid var(--line)" }}
          >
            <span>Nombre</span>
            <span>Categoría</span>
            <span>Estado</span>
            <span className="text-right">Acciones</span>
          </div>

          {/* Rows */}
          <ul>
            {venues.map((v) => {
              const cat = catById.get(v.categoryId);
              return (
                <li
                  key={v.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_180px_180px_90px] items-center gap-2 sm:gap-4 px-5 py-4 row-sep"
                >
                  <div className="min-w-0">
                    <p className="text-brand text-[17px] leading-tight truncate" style={{ color: "var(--fg)" }}>
                      {v.name}
                    </p>
                    <p className="text-data truncate" style={{ color: "var(--fg-30)" }}>
                      {v.slug}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--fg-70)" }}>
                    {cat ? (
                      <>
                        <span>{CATEGORY_EMOJI[cat.slug] ?? "•"}</span>
                        <span>{cat.name}</span>
                      </>
                    ) : (
                      <span style={{ color: "var(--fg-30)" }}>— sin categoría —</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        background: "color-mix(in oklab, " + statusColor(v.status) + " 18%, transparent)",
                        color: statusColor(v.status),
                      }}
                    >
                      {STATUS_LABEL[v.status]}
                    </span>
                  </div>

                  <div className="flex items-center justify-start sm:justify-end gap-3">
                    <QuickStatusBtn id={v.id} slug={v.slug} status={v.status} />
                    <Link
                      href={`/admin/lugares/${v.slug}/editar`}
                      className="text-sm font-medium transition-opacity hover:opacity-70"
                      style={{ color: "var(--terra)" }}
                    >
                      Editar
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </main>
  );
}
