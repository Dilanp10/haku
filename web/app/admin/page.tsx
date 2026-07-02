import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function loadStats() {
  const supabase = await createServerSupabase();

  const [venuesRes, eventsRes, sourcesRes] = await Promise.all([
    supabase.from("venues").select("status"),
    supabase.from("events").select("status"),
    supabase.from("event_sources").select("active"),
  ]);

  const byStatus = <T extends { status: string }>(rows: T[] | null) =>
    (rows ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});

  const venues = byStatus(venuesRes.data as { status: string }[] | null);
  const events = byStatus(eventsRes.data as { status: string }[] | null);
  const sourcesActive = (sourcesRes.data ?? []).filter((s: { active: boolean }) => s.active).length;
  const sourcesTotal = (sourcesRes.data ?? []).length;

  return { venues, events, sourcesActive, sourcesTotal };
}

export default async function AdminHomePage() {
  const profile = await requireProfile("admin");
  const stats = await loadStats();

  const venuesToReview = (stats.venues["draft"] ?? 0);
  const eventsToReview = (stats.events["pending"] ?? 0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-brand text-3xl" style={{ color: "var(--terra)" }}>
        Hola, {profile.displayName ?? "admin"}
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--fg-50)" }}>
        Panel de administración de Haku.
      </p>

      {/* Stats */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Lugares publicados"
          value={stats.venues["published"] ?? 0}
          sub={`${stats.venues["draft"] ?? 0} borrador · ${stats.venues["archived"] ?? 0} archivados`}
          alert={venuesToReview > 0 ? `${venuesToReview} sin publicar` : undefined}
        />
        <StatCard
          label="Eventos publicados"
          value={stats.events["published"] ?? 0}
          sub={`${stats.events["rejected"] ?? 0} rechazados`}
          alert={eventsToReview > 0 ? `${eventsToReview} pendientes` : undefined}
        />
        <StatCard
          label="Fuentes de eventos"
          value={stats.sourcesActive}
          sub={`de ${stats.sourcesTotal} total`}
        />
        <StatCard
          label="Por moderar"
          value={eventsToReview + venuesToReview}
          sub="eventos pendientes + borradores"
          alert={(eventsToReview + venuesToReview) > 0 ? "Requiere atención" : undefined}
        />
      </section>

      {/* Acciones rápidas */}
      <section className="mt-10">
        <h2 className="text-section mb-4">Acciones rápidas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            href="/admin/eventos"
            title="Moderar eventos"
            desc={eventsToReview > 0 ? `${eventsToReview} eventos pendientes de revisión.` : "Sin eventos pendientes."}
            urgent={eventsToReview > 0}
          />
          <ActionCard
            href="/admin/lugares"
            title="Gestionar lugares"
            desc="Crear, editar y publicar venues."
          />
          <ActionCard
            href="/admin/lugares/nuevo"
            title="Nuevo lugar"
            desc="Agregar un venue al directorio."
          />
          <ActionCard
            href="/lugares"
            title="Ver sitio público"
            desc="Tal como lo ven los visitantes."
          />
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  alert,
}: {
  label: string;
  value: number;
  sub?: string | undefined;
  alert?: string | undefined;
}) {
  return (
    <div
      className="rounded-[12px] border p-5"
      style={{ borderColor: "var(--line)", background: "var(--card-bg)" }}
    >
      <p className="text-section">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums" style={{ color: "var(--fg)" }}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs" style={{ color: "var(--fg-50)" }}>{sub}</p>}
      {alert && <p className="mt-2 text-xs font-semibold" style={{ color: "var(--terra)" }}>{alert}</p>}
    </div>
  );
}

function ActionCard({
  href,
  title,
  desc,
  urgent,
}: {
  href: string;
  title: string;
  desc: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="block rounded-[12px] border p-5 transition active:opacity-80"
      style={{
        borderColor: urgent ? "var(--terra)" : "var(--line)",
        background: urgent ? "var(--terra-wash)" : "var(--card-bg)",
      }}
    >
      <h3 className="text-brand text-lg" style={{ color: "var(--fg)" }}>{title}</h3>
      <p className="mt-1 text-sm" style={{ color: "var(--fg-50)" }}>{desc}</p>
    </Link>
  );
}

