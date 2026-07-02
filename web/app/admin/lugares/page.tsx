import Link from "next/link";
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
  published: "Publicado",
  archived: "Archivado",
};
const STATUS_TONE: Record<Venue["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-primary/10 text-primary",
  archived: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

type StatusFilter = "draft" | "published" | "archived" | undefined;

function hasPendingSuggestion(v: Venue): boolean {
  const a = (v.attributes ?? {}) as Record<string, unknown>;
  return Array.isArray(a["_hours"]) || typeof a["_audio_url"] === "string";
}

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: undefined, label: "Todos" },
  { value: "draft",     label: "Borradores" },
  { value: "published", label: "Publicados" },
  { value: "archived",  label: "Archivados" },
];

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

  const [venuesRes, categoriesRes] = await Promise.all([
    listVenues(repo, {
      pagination: { page: 1, pageSize: 100 },
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
    listCategories(repo),
  ]);
  if (!venuesRes.ok) throw new Error(venuesRes.error.message);
  const categories = categoriesRes.ok ? categoriesRes.value : [];
  const catById = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const venues = venuesRes.value.items;
  const total = venuesRes.value.total;

  return (
    <main className="container py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lugares</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "lugar" : "lugares"}{statusFilter ? ` en estado ${STATUS_LABEL[statusFilter].toLowerCase()}` : " en total"}.
          </p>
        </div>
        <Link
          href="/admin/lugares/nuevo"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Nuevo lugar
        </Link>
      </header>

      {/* Filtro por estado */}
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Filtrar por estado">
        {FILTER_OPTIONS.map(({ value, label }) => {
          const href = value ? `/admin/lugares?estado=${value}` : "/admin/lugares";
          const active = statusFilter === value;
          return (
            <Link
              key={label}
              href={href}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {venues.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
          No hay lugares con este filtro.
        </div>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {venues.map((v) => (
            <li key={v.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="truncate font-medium">{v.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_TONE[v.status]}`}>
                    {STATUS_LABEL[v.status]}
                  </span>
                  {hasPendingSuggestion(v) && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                      Sugerencia
                    </span>
                  )}
                  {catById.get(v.categoryId) ? (
                    <span className="text-xs text-muted-foreground">
                      {catById.get(v.categoryId)!.name}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  /lugares/{v.slug} · {v.viewCount.toLocaleString("es-AR")} visitas
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <QuickStatusBtn id={v.id} slug={v.slug} status={v.status} />
                <Link
                  href={`/admin/lugares/${v.slug}`}
                  className="rounded-md border px-3 py-1.5 text-sm hover:border-primary/40"
                >
                  Ver detalle
                </Link>
                <Link
                  href={`/admin/lugares/${v.slug}/editar`}
                  className="rounded-md border px-3 py-1.5 text-sm hover:border-primary/40"
                >
                  Editar
                </Link>
                {v.status === "published" ? (
                  <Link
                    href={`/lugares/${v.slug}`}
                    className="rounded-md border px-3 py-1.5 text-sm hover:border-primary/40"
                  >
                    Ver
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
