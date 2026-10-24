/**
 * Las categorías de eventos vienen del scraper con formatos mezclados: algunas
 * en SCREAMING_SNAKE_CASE ("CONGRESOS_Y_CONVENCIONES") y otras ya humanas
 * ("Espectáculos y Noche"). Esto solo tiene efecto sobre las que vienen feas y
 * deja intactas las que ya están bien formateadas.
 */
export function formatEventCategory(raw: string): string {
  const isUglyEnum = raw === raw.toUpperCase() || raw.includes("_");
  if (!isUglyEnum) return raw;
  const lower = raw.toLowerCase().replace(/_/g, " ").trim();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
