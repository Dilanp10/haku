import { describe, expect, it } from "vitest";
import { categoryEmoji, categoryVisual } from "./category-visuals";

describe("categoryVisual", () => {
  it("devuelve el visual de un slug conocido", () => {
    const v = categoryVisual("bar");
    expect(v.emoji).toBe("🍺");
    expect(v.bg).toMatch(/^rgba\(/);
    expect(v.fg).toMatch(/^#/);
  });

  it("devuelve fallback neutro para slug desconocido", () => {
    const v = categoryVisual("peluqueria");
    expect(v.emoji).toBe("📍");
  });

  it("devuelve fallback neutro para undefined", () => {
    const v = categoryVisual(undefined);
    expect(v.emoji).toBe("📍");
  });

  it("cubre las 8 categorías existentes con emoji propio", () => {
    const slugs = [
      "cafeteria",
      "restaurante",
      "bar",
      "heladeria",
      "panaderia",
      "pizzeria",
      "parrilla",
      "cerveceria",
    ];
    for (const slug of slugs) {
      expect(categoryVisual(slug).emoji).not.toBe("📍");
    }
  });
});

describe("categoryEmoji", () => {
  it("devuelve el emoji del slug conocido y bullet para desconocido", () => {
    expect(categoryEmoji("cafeteria")).toBe("☕");
    expect(categoryEmoji("x")).toBe("•");
  });
});
