import { describe, it, expect } from "vitest";
import { openStateAt, type OpeningRange } from "./opening-hours";

/** Helper: construye un Date en un día de semana + hora dados (hora local del runner). */
function at(day: number, hh: number, mm: number): Date {
  // 2024-01-07 fue domingo (day 0). Sumamos `day` para alinear getDay().
  const base = new Date(2024, 0, 7 + day, hh, mm, 0, 0);
  expect(base.getDay()).toBe(day);
  return base;
}

describe("openStateAt", () => {
  it("está abierto dentro de un rango simple", () => {
    const ranges: OpeningRange[] = [{ day: 1, opensAt: "09:00", closesAt: "18:00" }];
    const r = openStateAt(ranges, at(1, 12, 0));
    expect(r.open).toBe(true);
    expect(r.closesAt).toBe("18:00");
  });

  it("está cerrado fuera del rango", () => {
    const ranges: OpeningRange[] = [{ day: 1, opensAt: "09:00", closesAt: "18:00" }];
    expect(openStateAt(ranges, at(1, 20, 0)).open).toBe(false);
    expect(openStateAt(ranges, at(1, 8, 30)).open).toBe(false);
  });

  it("cerrado si el rango es de otro día", () => {
    const ranges: OpeningRange[] = [{ day: 1, opensAt: "09:00", closesAt: "18:00" }];
    expect(openStateAt(ranges, at(2, 12, 0)).open).toBe(false);
  });

  it("maneja rango que cruza la medianoche (abierto de noche)", () => {
    const ranges: OpeningRange[] = [{ day: 5, opensAt: "21:00", closesAt: "05:00" }];
    // Viernes 23:30 → dentro (>= 21:00)
    expect(openStateAt(ranges, at(5, 23, 30)).open).toBe(true);
    // Viernes 03:00 → dentro (<= 05:00, madrugada contada en el mismo registro de día)
    expect(openStateAt(ranges, at(5, 3, 0)).open).toBe(true);
    // Viernes 12:00 → cerrado
    expect(openStateAt(ranges, at(5, 12, 0)).open).toBe(false);
  });

  it("soporta múltiples rangos el mismo día (mañana + tarde)", () => {
    const ranges: OpeningRange[] = [
      { day: 3, opensAt: "09:00", closesAt: "13:00" },
      { day: 3, opensAt: "17:00", closesAt: "23:00" },
    ];
    expect(openStateAt(ranges, at(3, 10, 0)).open).toBe(true); // mañana
    expect(openStateAt(ranges, at(3, 15, 0)).open).toBe(false); // siesta
    const tarde = openStateAt(ranges, at(3, 20, 0));
    expect(tarde.open).toBe(true);
    expect(tarde.closesAt).toBe("23:00");
  });

  it("cerrado si no hay rangos", () => {
    expect(openStateAt([], at(1, 12, 0)).open).toBe(false);
  });

  it("normaliza HH:MM:SS a HH:MM en closesAt", () => {
    const ranges: OpeningRange[] = [{ day: 2, opensAt: "09:00:00", closesAt: "18:30:00" }];
    const r = openStateAt(ranges, at(2, 10, 0));
    expect(r.open).toBe(true);
    expect(r.closesAt).toBe("18:30");
  });
});
