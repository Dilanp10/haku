import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createICalSource } from "./ical.source";

const SAMPLE_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Haku Test//ES
BEGIN:VEVENT
SUMMARY:Feria Nacional del Poncho
DTSTART:20260719T160000Z
DTEND:20260730T230000Z
DESCRIPTION:Artesanías\\, gastronomía y espectáculos.
LOCATION:Predio Ferial, Av. Alem 1000\\, S. F. del Valle de Catamarca
URL:https://catamarca.gob.ar/feria-poncho
GEO:-28.4554;-65.7886
END:VEVENT
BEGIN:VEVENT
SUMMARY:Concierto Sinfónico Provincial
DTSTART:20260802T203000
DTEND:20260802T223000
DESCRIPTION:Repertorio de música argentina.
LOCATION:Teatro de la Juventud
END:VEVENT
BEGIN:VEVENT
SUMMARY:Sin fecha válida
DTSTART:not-a-date
END:VEVENT
END:VCALENDAR
`;

describe("ICalSource", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: async () => SAMPLE_ICS,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("extrae 2 RawEvents válidos, descarta el VEVENT sin fecha", async () => {
    const source = createICalSource({
      key: "test-ical",
      url: "https://example.com/agenda.ics",
      userAgent: "HakuBot/test",
    });

    const events = await source.fetch(new Date());
    expect(events).toHaveLength(2);

    const [feria, sinfonica] = events;
    expect(feria!.title).toBe("Feria Nacional del Poncho");
    expect(feria!.startsAt).toBe("2026-07-19T16:00:00.000Z");
    expect(feria!.endsAt).toBe("2026-07-30T23:00:00.000Z");
    expect(feria!.description).toBe("Artesanías, gastronomía y espectáculos.");
    expect(feria!.venueName).toBe("Predio Ferial");
    expect(feria!.address).toBe("Av. Alem 1000, S. F. del Valle de Catamarca");
    expect(feria!.url).toBe("https://catamarca.gob.ar/feria-poncho");
    expect(feria!.location).toEqual({ lat: -28.4554, lng: -65.7886 });

    // DTSTART sin Z → asume UTC-3 → +3h
    expect(sinfonica!.title).toBe("Concierto Sinfónico Provincial");
    const sinfStart = new Date(sinfonica!.startsAt);
    expect(sinfStart.getUTCHours()).toBe(23); // 20:30 ARG + 3 = 23:30 UTC
    expect(sinfonica!.venueName).toBe("Teatro de la Juventud");
    expect(sinfonica!.address).toBeUndefined();
  });

  it("lanza error si el feed falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    const source = createICalSource({
      key: "test-ical",
      url: "https://example.com/agenda.ics",
      userAgent: "HakuBot/test",
    });
    await expect(source.fetch(new Date())).rejects.toThrow("HTTP 503");
  });
});
