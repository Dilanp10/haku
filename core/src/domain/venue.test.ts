import { describe, it, expect } from "vitest";
import { distanceKm } from "./venue";

describe("distanceKm", () => {
  it("vale 0 entre el mismo punto", () => {
    expect(distanceKm({ lat: -28.47, lng: -65.78 }, { lat: -28.47, lng: -65.78 })).toBeCloseTo(0, 6);
  });

  it("aproxima 111 km por 1 grado de latitud sobre el ecuador", () => {
    const d = distanceKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });

  it("es simétrica", () => {
    const a = { lat: -28.4696, lng: -65.7795 };
    const b = { lat: -28.5, lng: -65.6 };
    expect(distanceKm(a, b)).toBeCloseTo(distanceKm(b, a), 9);
  });
});
