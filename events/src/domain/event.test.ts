import { describe, expect, it } from "vitest";
import { dedupeHash, hourEpoch, normalize, normalizeTitle } from "./event";

describe("normalizeTitle", () => {
  it("quita tildes y pasa a minúsculas", () => {
    expect(normalizeTitle("Música en Vivo")).toBe("musica en vivo");
    expect(normalizeTitle("CORAZÓN")).toBe("corazon");
  });

  it("colapsa signos y espacios extra", () => {
    expect(normalizeTitle("La Beriso – Show")).toBe("la beriso show");
    expect(normalizeTitle("  TURF   @   Cine  Teatro  ")).toBe("turf cine teatro");
    expect(normalizeTitle("¡Hola!, mundo…")).toBe("hola mundo");
  });

  it("conserva alfanuméricos", () => {
    expect(normalizeTitle("Expo Catamarca 2026")).toBe("expo catamarca 2026");
    expect(normalizeTitle("4to Simposio")).toBe("4to simposio");
  });
});

describe("hourEpoch", () => {
  it("trunca a la hora exacta", () => {
    const a = hourEpoch("2026-10-25T20:00:00.000Z");
    const b = hourEpoch("2026-10-25T20:15:30.123Z");
    const c = hourEpoch("2026-10-25T20:59:59.999Z");
    expect(a).toBe(b);
    expect(a).toBe(c);
  });

  it("distingue horas diferentes", () => {
    const h20 = hourEpoch("2026-10-25T20:00:00.000Z");
    const h21 = hourEpoch("2026-10-25T21:00:00.000Z");
    expect(h20).not.toBe(h21);
    expect(h21 - h20).toBe(3_600_000);
  });

  it("devuelve múltiplo de 3600000", () => {
    const t = hourEpoch("2026-10-25T20:37:42.000Z");
    expect(t % 3_600_000).toBe(0);
  });
});

describe("dedupeHash", () => {
  it("colapsa dos fuentes del mismo evento al mismo hash", () => {
    const fromSfvc = { title: "La Beriso", startsAt: "2026-10-25T21:30:00Z" };
    const fromEntradaweb = { title: "LA BERISO", startsAt: "2026-10-25T21:30:00Z" };
    expect(dedupeHash(fromSfvc)).toBe(dedupeHash(fromEntradaweb));
  });

  it("tolera minutos distintos dentro de la misma hora", () => {
    const a = { title: "Peña del Rodeo", startsAt: "2026-10-25T22:00:00Z" };
    const b = { title: "Peña del Rodeo", startsAt: "2026-10-25T22:45:00Z" };
    expect(dedupeHash(a)).toBe(dedupeHash(b));
  });

  it("distingue si cambia la hora", () => {
    const a = { title: "Peña del Rodeo", startsAt: "2026-10-25T22:00:00Z" };
    const b = { title: "Peña del Rodeo", startsAt: "2026-10-26T22:00:00Z" };
    expect(dedupeHash(a)).not.toBe(dedupeHash(b));
  });

  it("distingue si cambia el título", () => {
    const a = { title: "Peña A", startsAt: "2026-10-25T22:00:00Z" };
    const b = { title: "Peña B", startsAt: "2026-10-25T22:00:00Z" };
    expect(dedupeHash(a)).not.toBe(dedupeHash(b));
  });

  it("produce 32 hex (md5)", () => {
    const h = dedupeHash({ title: "x", startsAt: "2026-01-01T00:00:00Z" });
    expect(h).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe("normalize", () => {
  it("devuelve extraSources vacío por default", () => {
    const result = normalize({
      sourceKey: "sfvc",
      title: "Un evento",
      startsAt: "2026-10-25T20:00:00Z",
    });
    expect(result.extraSources).toEqual([]);
    expect(result.status).toBe("pending");
  });

  it("mismo título y misma hora producen mismo slug aunque cambie el source", () => {
    const a = normalize({ sourceKey: "sfvc", title: "La Beriso", startsAt: "2026-10-25T21:00:00Z" });
    const b = normalize({ sourceKey: "entradaweb", title: "La Beriso", startsAt: "2026-10-25T21:00:00Z" });
    expect(a.slug).toBe(b.slug);
    expect(a.dedupeHash).toBe(b.dedupeHash);
  });
});
