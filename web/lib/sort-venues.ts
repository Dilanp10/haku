/**
 * Orden "abierto primero" para listas de venues (spec 031, O3).
 * Abiertos antes que no-abiertos (orden estable); si hay distancias,
 * distancia ascendente dentro de cada grupo (sin distancia → al final del grupo).
 */
export function sortVenuesByOpenFirst<T extends { id: string }>(
  venues: T[],
  isOpen: (id: string) => boolean,
  distanceOf?: (id: string) => number | undefined,
): T[] {
  const indexOf = new Map(venues.map((v, i) => [v.id, i]));

  return [...venues].sort((a, b) => {
    const openA = isOpen(a.id);
    const openB = isOpen(b.id);
    if (openA !== openB) return openA ? -1 : 1;

    if (distanceOf) {
      const da = distanceOf(a.id) ?? Infinity;
      const db = distanceOf(b.id) ?? Infinity;
      if (da !== db) return da - db;
    }

    // Estabilidad explícita: conservar el orden de llegada dentro del grupo.
    return (indexOf.get(a.id) ?? 0) - (indexOf.get(b.id) ?? 0);
  });
}
