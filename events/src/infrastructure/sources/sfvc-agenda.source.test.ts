import { describe, it, expect, vi, afterEach } from "vitest";
import { createSfvcAgendaSource, mapSfvcHit } from "./sfvc-agenda.source";

describe("mapSfvcHit", () => {
  it("mapea los campos principales de un hit válido", () => {
    const raw = mapSfvcHit(
      {
        id: 44,
        original_id: "act-44",
        titulo: "Ecotours",
        descripcion: "Trekking en SFVC",
        timestamp: 1790726400000,
        lugar: "Catamarca",
        url: "/actividades/ecotours",
        imagen: "https://cdn.example/img.jpg",
        tematicas: ["Naturaleza"],
        datos_completos: { direccion: "Av. Alem 1000", coordenadas_de_ubicacion: "-28.47,-65.77" },
      },
      "sfvc-agenda",
      "https://sfvc.tur.ar",
    );
    expect(raw).not.toBeNull();
    expect(raw!.title).toBe("Ecotours");
    expect(raw!.externalId).toBe("act-44");
    expect(raw!.startsAt).toBe(new Date(1790726400000).toISOString());
    expect(raw!.venueName).toBe("Catamarca");
    expect(raw!.address).toBe("Av. Alem 1000");
    expect(raw!.location).toEqual({ lat: -28.47, lng: -65.77 });
    expect(raw!.url).toBe("https://sfvc.tur.ar/actividades/ecotours");
    expect(raw!.imageUrl).toBe("https://cdn.example/img.jpg");
    expect(raw!.category).toBe("Naturaleza");
  });

  it("cae a date+hora cuando falta timestamp", () => {
    const raw = mapSfvcHit({ titulo: "X", date: "2026-10-05", hora: "20:30:00" }, "src");
    expect(raw!.startsAt).toBe(new Date("2026-10-05T20:30:00-03:00").toISOString());
  });

  it("descarta hits sin título o sin fecha", () => {
    expect(mapSfvcHit({ titulo: "sin fecha" }, "src")).toBeNull();
    expect(mapSfvcHit({ timestamp: 1 }, "src")).toBeNull();
  });

  it("no prepende prefijo a URLs ya absolutas", () => {
    const raw = mapSfvcHit(
      { titulo: "X", timestamp: 1, url: "https://otro.com/ev" },
      "src",
      "https://sfvc.tur.ar",
    );
    expect(raw!.url).toBe("https://otro.com/ev");
  });
});

describe("createSfvcAgendaSource", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("pega al Meilisearch con Bearer y mapea la respuesta", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          hits: [
            { titulo: "Evento A", timestamp: 1790726400000, original_id: "a" },
            { titulo: "Evento B", timestamp: 1790812800000, original_id: "b" },
            { titulo: "Sin fecha" },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const source = createSfvcAgendaSource({
      key: "sfvc-agenda",
      host: "https://buscar.apps.sfvc.tur.ar",
      meiliKey: "pk_test",
      indexUid: "idx_agenda",
      userAgent: "Haku test",
    });
    const events = await source.fetch(new Date());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://buscar.apps.sfvc.tur.ar/indexes/idx_agenda/search");
    expect((init as RequestInit).headers).toMatchObject({
      authorization: "Bearer pk_test",
      "content-type": "application/json",
    });
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.externalId)).toEqual(["a", "b"]);
  });

  it("propaga error si Meilisearch responde con message", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: "invalid_api_key" }), { status: 200 }),
      ) as unknown as typeof fetch;

    const source = createSfvcAgendaSource({
      key: "sfvc-agenda",
      host: "https://x",
      meiliKey: "bad",
      indexUid: "idx_agenda",
      userAgent: "Haku test",
    });
    await expect(source.fetch(new Date())).rejects.toThrow(/invalid_api_key/);
  });
});
