import { describe, expect, it } from "vitest";
import { sortVenuesByOpenFirst } from "./sort-venues";

const v = (id: string) => ({ id });
const ids = (xs: { id: string }[]) => xs.map((x) => x.id);

describe("sortVenuesByOpenFirst", () => {
  it("todos abiertos: conserva el orden de llegada", () => {
    const out = sortVenuesByOpenFirst([v("a"), v("b"), v("c")], () => true);
    expect(ids(out)).toEqual(["a", "b", "c"]);
  });

  it("todos cerrados: conserva el orden de llegada", () => {
    const out = sortVenuesByOpenFirst([v("a"), v("b"), v("c")], () => false);
    expect(ids(out)).toEqual(["a", "b", "c"]);
  });

  it("mixto: abiertos primero, orden relativo estable en cada grupo", () => {
    const open = new Set(["b", "d"]);
    const out = sortVenuesByOpenFirst(
      [v("a"), v("b"), v("c"), v("d")],
      (id) => open.has(id),
    );
    expect(ids(out)).toEqual(["b", "d", "a", "c"]);
  });

  it("con distancias: distancia ascendente dentro de cada grupo", () => {
    const open = new Set(["a", "b"]);
    const dist: Record<string, number> = { a: 5, b: 1, c: 3, d: 0.5 };
    const out = sortVenuesByOpenFirst(
      [v("a"), v("b"), v("c"), v("d")],
      (id) => open.has(id),
      (id) => dist[id],
    );
    // Abiertos por distancia: b(1) < a(5). Cerrados por distancia: d(0.5) < c(3).
    expect(ids(out)).toEqual(["b", "a", "d", "c"]);
  });

  it("distancia undefined va al final de su grupo", () => {
    const open = new Set(["a", "b", "c"]);
    const dist: Record<string, number | undefined> = { a: undefined, b: 2, c: 1 };
    const out = sortVenuesByOpenFirst(
      [v("a"), v("b"), v("c")],
      (id) => open.has(id),
      (id) => dist[id],
    );
    expect(ids(out)).toEqual(["c", "b", "a"]);
  });

  it("no muta el array original", () => {
    const input = [v("a"), v("b")];
    const copy = [...input];
    sortVenuesByOpenFirst(input, (id) => id === "b");
    expect(input).toEqual(copy);
  });
});
