/**
 * Única fuente del mapeo visual por categoría.
 * Colores neutros que funcionan sobre --card-bg en ambos temas (Mono/Noche).
 */

export interface CategoryVisual {
  emoji: string;
  /** Fondo del placeholder (wash translúcido). */
  bg: string;
  /** Color sólido de acento de la categoría. */
  fg: string;
}

const WASH = {
  coral: "rgba(255,90,54,0.12)",
  amber: "rgba(245,158,11,0.14)",
  emerald: "rgba(16,185,129,0.14)",
  sky: "rgba(14,165,233,0.12)",
  violet: "rgba(139,92,246,0.12)",
  neutral: "rgba(128,128,128,0.12)",
} as const;

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  cafeteria: { emoji: "☕", bg: WASH.amber, fg: "#D97706" },
  restaurante: { emoji: "🍽", bg: WASH.coral, fg: "#EA580C" },
  bar: { emoji: "🍺", bg: WASH.violet, fg: "#7C3AED" },
  heladeria: { emoji: "🍦", bg: WASH.sky, fg: "#0EA5E9" },
  panaderia: { emoji: "🥐", bg: WASH.amber, fg: "#D97706" },
  pizzeria: { emoji: "🍕", bg: WASH.coral, fg: "#EA580C" },
  parrilla: { emoji: "🥩", bg: WASH.coral, fg: "#DC2626" },
  cerveceria: { emoji: "🍻", bg: WASH.emerald, fg: "#059669" },
};

const FALLBACK: CategoryVisual = {
  emoji: "📍",
  bg: WASH.neutral,
  fg: "#6B7280",
};

/** Visual de una categoría por slug; fallback neutro si no está mapeada. */
export function categoryVisual(slug: string | undefined): CategoryVisual {
  if (!slug) return FALLBACK;
  return CATEGORY_VISUALS[slug] ?? FALLBACK;
}

/** Solo el emoji (compat con los chips de filtros). */
export function categoryEmoji(slug: string): string {
  return CATEGORY_VISUALS[slug]?.emoji ?? "•";
}
