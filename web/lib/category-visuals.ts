/**
 * Única fuente del mapeo visual por categoría (spec 031, O2).
 * Colores de la paleta Tierra en versión "wash" (rgba translúcida) para que
 * funcionen sobre --card-bg tanto en light como en dark mode.
 */

export interface CategoryVisual {
  emoji: string;
  /** Fondo del placeholder (wash translúcido de la paleta Tierra). */
  bg: string;
  /** Color sólido de acento de la categoría (texto/íconos sobre fondos claros). */
  fg: string;
}

// Hex de referencia (globals.css): terra #D67849, ochre #C99347,
// moss #8AA265, rust #C0664E, terra-soft #E89B6F.
const WASH = {
  terra: "rgba(214,120,73,0.16)",
  terraSoft: "rgba(232,155,111,0.18)",
  ochre: "rgba(201,147,71,0.16)",
  moss: "rgba(138,162,101,0.16)",
  rust: "rgba(192,102,78,0.16)",
  neutral: "rgba(128,120,110,0.14)",
} as const;

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  cafeteria: { emoji: "☕", bg: WASH.ochre, fg: "#C99347" },
  restaurante: { emoji: "🍽", bg: WASH.terra, fg: "#D67849" },
  bar: { emoji: "🍺", bg: WASH.rust, fg: "#C0664E" },
  heladeria: { emoji: "🍦", bg: WASH.terraSoft, fg: "#E89B6F" },
  panaderia: { emoji: "🥐", bg: WASH.ochre, fg: "#C99347" },
  pizzeria: { emoji: "🍕", bg: WASH.terra, fg: "#D67849" },
  parrilla: { emoji: "🥩", bg: WASH.rust, fg: "#C0664E" },
  cerveceria: { emoji: "🍻", bg: WASH.moss, fg: "#8AA265" },
};

const FALLBACK: CategoryVisual = {
  emoji: "📍",
  bg: WASH.neutral,
  fg: "#807870",
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
