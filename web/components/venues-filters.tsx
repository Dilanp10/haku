"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal, X, Search, Heart } from "lucide-react";
import type { Category, FoodType } from "@haku/core";
import { categoryEmoji } from "@/lib/category-visuals";

interface Props {
  categories: Category[];
  foodTypes: FoodType[];
  basePath?: string;
  compact?: boolean;
}

// Atributos alineados con lo que morficat mostraba
const ATTRIBUTES = [
  { key: "terraza", label: "Terraza" },
  { key: "mesas_afuera", label: "Mesas afuera" },
  { key: "mesas_adentro", label: "Mesas adentro" },
  { key: "wifi", label: "WiFi" },
  { key: "aire_acondicionado", label: "Aire acondicionado" },
  { key: "estacionamiento", label: "Estacionamiento" },
  { key: "acepta_tarjetas", label: "Acepta tarjetas" },
  { key: "acepta_reservas", label: "Acepta reservas" },
  { key: "accesible", label: "Accesible" },
  { key: "acepta_mascotas", label: "Acepta mascotas" },
  { key: "musica_en_vivo", label: "Música en vivo" },
  { key: "dj", label: "DJ" },
  { key: "karaoke", label: "Karaoke" },
  { key: "juegos_ninos", label: "Juegos para niños" },
] as const;

const PRICES = [
  { key: "$", label: "$" },
  { key: "$$", label: "$$" },
  { key: "$$$", label: "$$$" },
] as const;

function parseList(v: string | null): string[] {
  if (!v) return [];
  return v.split(",").filter(Boolean);
}

export function VenuesFilters({
  categories,
  foodTypes,
  basePath = "/lugares",
  compact = false,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [openNow, setOpenNow] = useState(sp.get("abierto") === "1");
  const [cats, setCats] = useState<string[]>(parseList(sp.get("categoria")));
  const [foods, setFoods] = useState<string[]>(parseList(sp.get("comida")));
  const [prices, setPrices] = useState<string[]>(parseList(sp.get("precio")));
  const [attrs, setAttrs] = useState<string[]>(parseList(sp.get("attrs")));
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [panelOpen, setPanelOpen] = useState(false);

  const totalActive =
    (openNow ? 1 : 0) +
    cats.length +
    foods.length +
    prices.length +
    attrs.length +
    (q ? 1 : 0);

  const syncUrl = useMemo(
    () => (state: {
      openNow: boolean;
      cats: string[];
      foods: string[];
      prices: string[];
      attrs: string[];
      q: string;
    }) => {
      const qs = new URLSearchParams();
      if (state.openNow) qs.set("abierto", "1");
      if (state.cats.length) qs.set("categoria", state.cats.join(","));
      if (state.foods.length) qs.set("comida", state.foods.join(","));
      if (state.prices.length) qs.set("precio", state.prices.join(","));
      if (state.attrs.length) qs.set("attrs", state.attrs.join(","));
      if (state.q) qs.set("q", state.q);
      const url = qs.toString() ? `${basePath}?${qs.toString()}` : basePath;
      startTransition(() => router.replace(url, { scroll: false }));
    },
    [router, basePath],
  );

  useEffect(() => {
    syncUrl({ openNow, cats, foods, prices, attrs, q });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNow, cats, foods, prices, attrs]);

  useEffect(() => {
    const t = setTimeout(
      () => syncUrl({ openNow, cats, foods, prices, attrs, q }),
      350,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) => {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  };

  const clearAll = () => {
    setOpenNow(false);
    setCats([]);
    setFoods([]);
    setPrices([]);
    setAttrs([]);
    setQ("");
  };

  if (compact) {
    return (
      <>
        {/* Search bar */}
        <div className="relative mt-5">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "var(--fg-30)" }}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Buscar lugar, categoría..."
            className="h-11 w-full rounded-[12px] border pl-10 pr-4 text-sm transition focus:outline-none focus:ring-2"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--line-2)",
              color: "var(--fg)",
            }}
          />
        </div>

        {/* Carrusel de chips estilo texto + emoji + underline */}
        <div className="mt-4 flex gap-5 overflow-x-auto scrollbar-none pb-2">
          <TextChip
            active={openNow}
            onClick={() => setOpenNow(!openNow)}
            dot
            label="Abierto ahora"
          />
          <TextChipLink href="/perfil/favoritos" icon={<Heart className="h-3.5 w-3.5" strokeWidth={2} />} label="Favoritos" />
          {categories.map((c) => (
            <TextChip
              key={c.id}
              active={cats.includes(c.slug)}
              onClick={() => toggle(cats, setCats, c.slug)}
              emoji={categoryEmoji(c.slug)}
              label={c.name}
            />
          ))}
          <TextChip
            active={panelOpen}
            onClick={() => setPanelOpen(!panelOpen)}
            icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
            label="Filtros"
            {...(totalActive > 0 ? { badge: totalActive } : {})}
          />
        </div>

        {/* Panel inline */}
        {panelOpen && (
          <InlineFiltersPanel
            categories={categories}
            foodTypes={foodTypes}
            openNow={openNow}
            cats={cats}
            foods={foods}
            prices={prices}
            attrs={attrs}
            setOpenNow={setOpenNow}
            setCats={setCats}
            setFoods={setFoods}
            setPrices={setPrices}
            setAttrs={setAttrs}
            totalActive={totalActive}
            clearAll={clearAll}
            onClose={() => setPanelOpen(false)}
          />
        )}

        {pending && (
          <p className="mt-1 text-data" style={{ color: "var(--fg-30)" }}>
            Actualizando...
          </p>
        )}
      </>
    );
  }

  // /lugares full page: mismo estilo carrusel pero encima del listado
  return (
    <>
      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: "var(--fg-30)" }}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Buscar lugar, categoría..."
          className="h-11 w-full rounded-[12px] border pl-10 pr-4 text-sm transition focus:outline-none focus:ring-2"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--line-2)",
            color: "var(--fg)",
          }}
        />
      </div>

      <div className="mb-4 flex gap-5 overflow-x-auto scrollbar-none pb-2">
        <TextChip
          active={openNow}
          onClick={() => setOpenNow(!openNow)}
          dot
          label="Abierto ahora"
        />
        {categories.map((c) => (
          <TextChip
            key={c.id}
            active={cats.includes(c.slug)}
            onClick={() => toggle(cats, setCats, c.slug)}
            emoji={categoryEmoji(c.slug)}
            label={c.name}
          />
        ))}
        <TextChip
          active={panelOpen}
          onClick={() => setPanelOpen(!panelOpen)}
          icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
          label="Filtros"
          {...(totalActive > 0 ? { badge: totalActive } : {})}
        />
      </div>

      {panelOpen && (
        <InlineFiltersPanel
          categories={categories}
          foodTypes={foodTypes}
          openNow={openNow}
          cats={cats}
          foods={foods}
          prices={prices}
          attrs={attrs}
          setOpenNow={setOpenNow}
          setCats={setCats}
          setFoods={setFoods}
          setPrices={setPrices}
          setAttrs={setAttrs}
          totalActive={totalActive}
          clearAll={clearAll}
          onClose={() => setPanelOpen(false)}
        />
      )}

      {pending && (
        <p className="mb-2 text-data" style={{ color: "var(--fg-30)" }}>
          Actualizando...
        </p>
      )}
    </>
  );
}

function TextChip({
  active,
  onClick,
  emoji,
  icon,
  dot,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  emoji?: string;
  icon?: React.ReactNode;
  dot?: boolean;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 inline-flex items-center gap-1.5 pb-1 transition"
      style={{
        color: active ? "var(--accent)" : "var(--fg-50)",
        borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
      }}
    >
      {dot && (
        <span className="relative inline-flex h-2 w-2">
          <span
            className="absolute inset-0 rounded-full opacity-75 animate-ping"
            style={{ background: "var(--success)" }}
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ background: "var(--success)" }}
          />
        </span>
      )}
      {emoji && <span className="text-base leading-none">{emoji}</span>}
      {icon}
      <span
        className="text-brand text-[15px] italic whitespace-nowrap"
        style={{ color: active ? "var(--accent)" : "var(--fg-70)" }}
      >
        {label}
      </span>
      {badge !== undefined && (
        <span
          className="ml-0.5 rounded-full px-1.5 text-[10px] font-semibold leading-tight"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function TextChipLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="shrink-0 inline-flex items-center gap-1.5 pb-1 transition"
      style={{
        color: "var(--fg-50)",
        borderBottom: "2px solid transparent",
      }}
    >
      {icon}
      <span
        className="text-brand text-[15px] italic whitespace-nowrap"
        style={{ color: "var(--fg-70)" }}
      >
        {label}
      </span>
    </Link>
  );
}

interface PanelProps {
  categories: Category[];
  foodTypes: FoodType[];
  openNow: boolean;
  cats: string[];
  foods: string[];
  prices: string[];
  attrs: string[];
  setOpenNow: (v: boolean) => void;
  setCats: (v: string[]) => void;
  setFoods: (v: string[]) => void;
  setPrices: (v: string[]) => void;
  setAttrs: (v: string[]) => void;
  totalActive: number;
  clearAll: () => void;
  onClose: () => void;
}

function InlineFiltersPanel(p: PanelProps) {
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  };

  return (
    <div
      className="mt-2 mb-4 rounded-[14px] border p-4 animate-slide-up"
      style={{ borderColor: "var(--line)", background: "var(--card-bg)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-section" style={{ color: "var(--accent)" }}>
          Filtros
        </p>
        <button
          type="button"
          onClick={p.onClose}
          className="rounded-full p-1 transition active:opacity-70"
          style={{ color: "var(--fg-50)" }}
          aria-label="Cerrar filtros"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Servicios en grid 2 columnas como morficat */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        {ATTRIBUTES.map((a) => {
          const active = p.attrs.includes(a.key);
          return (
            <label
              key={a.key}
              className="flex items-center gap-2 py-1.5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => toggle(p.attrs, p.setAttrs, a.key)}
                className="peer sr-only"
              />
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition"
                style={{
                  background: active ? "var(--accent)" : "var(--bg)",
                  borderColor: active ? "var(--accent)" : "var(--line-2)",
                }}
              >
                {active && (
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                )}
              </span>
              <span
                className="text-[15px]"
                style={{ color: "var(--fg-70)" }}
              >
                {a.label}
              </span>
            </label>
          );
        })}
      </div>

      {/* Food types (secundario) */}
      {p.foodTypes.length > 0 && (
        <div className="mt-4">
          <p className="text-section mb-2" style={{ color: "var(--accent)" }}>
            Qué encontrás
          </p>
          <div className="flex flex-wrap gap-2">
            {p.foodTypes.map((ft) => {
              const active = p.foods.includes(ft.slug);
              return (
                <button
                  key={ft.id}
                  type="button"
                  onClick={() => toggle(p.foods, p.setFoods, ft.slug)}
                  className="rounded-full border px-3 py-1 text-sm transition active:scale-[0.97]"
                  style={
                    active
                      ? {
                          background: "var(--accent)",
                          borderColor: "var(--accent)",
                          color: "#fff",
                        }
                      : {
                          background: "var(--bg)",
                          borderColor: "var(--line-2)",
                          color: "var(--fg-70)",
                        }
                  }
                >
                  {ft.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Precio */}
      <div className="mt-4">
        <p className="text-section mb-2" style={{ color: "var(--accent)" }}>
          Precio
        </p>
        <div className="flex gap-2">
          {PRICES.map((pr) => {
            const active = p.prices.includes(pr.key);
            return (
              <button
                key={pr.key}
                type="button"
                onClick={() => toggle(p.prices, p.setPrices, pr.key)}
                className="rounded-full border px-4 py-1 text-sm transition active:scale-[0.97]"
                style={
                  active
                    ? {
                        background: "var(--accent)",
                        borderColor: "var(--accent)",
                        color: "#fff",
                      }
                    : {
                        background: "var(--bg)",
                        borderColor: "var(--line-2)",
                        color: "var(--fg-70)",
                      }
                }
              >
                {pr.label}
              </button>
            );
          })}
        </div>
      </div>

      {p.totalActive > 0 && (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={p.clearAll}
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: "var(--fg-50)" }}
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  );
}
