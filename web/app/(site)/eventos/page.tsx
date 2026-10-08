import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  listUpcomingEvents,
  createSupabaseEventRepository,
  type Event,
} from "@haku/events";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Agenda",
  description: "Próximos eventos en Catamarca: peñas, ferias, conciertos y más.",
  alternates: { canonical: "/eventos" },
  openGraph: {
    title: "Agenda · Haku",
    description: "Qué está pasando en Catamarca. Próximas fechas, actualizadas automáticamente.",
    url: "/eventos",
  },
};

export const dynamic = "force-dynamic";

interface SearchParams {
  categoria?: string;
}

function catamarcaNow(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Catamarca" }),
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDayLabel(d: Date, now: Date): string {
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const weekDays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  if (isSameDay(d, now)) return "Hoy";
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(d, tomorrow)) return "Mañana";
  return `${weekDays[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]}`;
}

function formatTime(e: Event): string {
  if (!e.startsAt) return "Todo el día";
  try {
    const d = new Date(e.startsAt);
    if (isNaN(d.getTime())) return "Todo el día";
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    if (h === "00" && m === "00") return "Todo el día";
    return `${h}:${m}`;
  } catch {
    return "Todo el día";
  }
}

function isNextEvent(e: Event, now: Date): boolean {
  if (!e.startsAt) return false;
  const d = new Date(e.startsAt);
  return d.getTime() > now.getTime();
}

function groupByDay(events: Event[]): Map<string, Event[]> {
  const map = new Map<string, Event[]>();
  for (const e of events) {
    const dateStr = e.startsAt
      ? new Date(e.startsAt).toISOString().slice(0, 10)
      : "unknown";
    const list = map.get(dateStr) ?? [];
    list.push(e);
    map.set(dateStr, list);
  }
  return map;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createServerSupabase();
  const repo = createSupabaseEventRepository(supabase);
  const now = catamarcaNow();

  const [eventsRes, categories] = await Promise.all([
    listUpcomingEvents(repo, {
      limit: 50,
      ...(sp.categoria ? { category: sp.categoria } : {}),
    }),
    repo.listEventCategories(),
  ]);

  const events: Event[] = eventsRes.ok ? eventsRes.value : [];
  const grouped = groupByDay(events);

  let foundNext = false;

  return (
    <main id="main" className="mx-auto max-w-2xl px-4 pb-bottom">
      <header className="pt-6 pb-0">
        <h1 className="text-[32px] font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>
          Agenda
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-50)" }}>
          Lo que pasa en Catamarca
        </p>
      </header>

      {/* Category tabs */}
      {categories.length > 0 && (
        <nav
          aria-label="Categorías"
          className="mt-5 flex gap-5 overflow-x-auto scrollbar-none"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <CategoryTab href="/eventos" label="Todo" active={!sp.categoria} />
          {categories.map((c) => (
            <CategoryTab
              key={c}
              href={`/eventos?categoria=${encodeURIComponent(c)}`}
              label={c}
              active={sp.categoria === c}
            />
          ))}
        </nav>
      )}

      {events.length === 0 ? (
        <div
          className="mt-8 rounded-2xl border p-10 text-center text-sm"
          style={{ borderColor: "var(--line)", background: "var(--card-bg)", color: "var(--fg-50)" }}
        >
          No hay eventos próximos.
        </div>
      ) : (
        <div className="mt-4">
          {Array.from(grouped.entries()).map(([dateStr, dayEvents]) => {
            const dayDate = dateStr !== "unknown" ? new Date(dateStr + "T12:00:00") : now;
            return (
              <section key={dateStr} className="mb-2">
                <p
                  className="px-1 py-3 text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--fg-50)" }}
                >
                  {formatDayLabel(dayDate, now)}
                </p>
                <div>
                  {dayEvents.map((e) => {
                    const time = formatTime(e);
                    const isNext = !foundNext && isNextEvent(e, now);
                    if (isNext) foundNext = true;
                    return (
                      <Link
                        key={e.id}
                        href={`/eventos/${e.slug}` as never}
                        className="grid items-start gap-2 rounded-2xl px-2 py-4 transition-colors hover:bg-[var(--card-2)]"
                        style={{
                          gridTemplateColumns: "72px minmax(0, 1fr) 18px",
                          borderBottom: "1px solid var(--line)",
                        }}
                      >
                        <span className="flex flex-col gap-1.5">
                          <span className="text-base font-extrabold tabular-nums">
                            {time === "Todo el día" ? (
                              <span className="text-[13px] font-semibold" style={{ color: "var(--fg-50)" }}>
                                Todo el día
                              </span>
                            ) : (
                              time
                            )}
                          </span>
                          {isNext && (
                            <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--accent)" }}>
                              <span className="relative h-[7px] w-[7px]">
                                <span
                                  className="absolute inset-0 animate-ping rounded-full"
                                  style={{ background: "var(--accent)", opacity: 0.4 }}
                                />
                                <span
                                  className="absolute inset-0 rounded-full"
                                  style={{ background: "var(--accent)" }}
                                />
                              </span>
                              Próximo
                            </span>
                          )}
                        </span>
                        <span>
                          <span className="block text-base font-bold leading-snug">
                            {e.title}
                          </span>
                          <span className="mt-1 block text-sm" style={{ color: "var(--fg-50)" }}>
                            {[e.venueName, e.category].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <ChevronRight size={18} style={{ color: "var(--fg-30)", marginTop: 2 }} />
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-4 pb-4 text-xs" style={{ color: "var(--fg-50)" }}>
        Fuente: agenda de Turismo de San Fernando del Valle
      </p>
    </main>
  );
}

function CategoryTab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="relative shrink-0 pb-3 text-sm transition-colors"
      style={{
        fontWeight: active ? 700 : 600,
        color: active ? "var(--fg)" : "var(--fg-50)",
      }}
    >
      {label}
      {active && (
        <span
          className="absolute bottom-[-1px] left-0 right-0 h-[2px]"
          style={{ background: "var(--fg)" }}
        />
      )}
    </Link>
  );
}
