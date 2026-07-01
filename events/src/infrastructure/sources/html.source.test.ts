import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHtmlSource } from "./html.source";

const SAMPLE_HTML = `
<html><body>
  <article class="evento">
    <h3 class="titulo">Feria del Poncho</h3>
    <time datetime="2026-07-19T16:00:00Z">19 jul 2026</time>
    <p class="descripcion">Artesanías y gastronomía.</p>
    <a class="mas-info" href="/eventos/poncho">Más info</a>
    <span class="lugar">Predio Ferial</span>
    <span class="dir">Av. Alem 1000, Catamarca</span>
  </article>
  <article class="evento">
    <h3 class="titulo">Concierto Sinfónico</h3>
    <time datetime="2026-08-02T20:30:00Z">2 ago 2026</time>
    <p class="descripcion">Repertorio argentino.</p>
    <a class="mas-info" href="/eventos/sinfonica">Más info</a>
  </article>
  <article class="evento">
    <h3 class="titulo">Sin fecha</h3>
    <time datetime="not-a-date">hoy</time>
  </article>
</body></html>
`;

describe("HtmlSource", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: async () => SAMPLE_HTML,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("extrae 2 RawEvents válidos, descarta el que no tiene fecha", async () => {
    const source = createHtmlSource({
      key: "test-html",
      url: "https://example.com/agenda",
      userAgent: "HakuBot/test",
      wrapper: "article.evento",
      titleSelector: "h3.titulo",
      dateSelector: "time",
      dateAttr: "datetime",
      descSelector: "p.descripcion",
      linkSelector: "a.mas-info",
      venueSelector: "span.lugar",
      addressSelector: "span.dir",
      baseUrl: "https://example.com",
    });

    const events = await source.fetch(new Date());
    expect(events).toHaveLength(2);

    const [feria, sinfonica] = events;
    expect(feria!.title).toBe("Feria del Poncho");
    expect(feria!.startsAt).toBe("2026-07-19T16:00:00.000Z");
    expect(feria!.description).toBe("Artesanías y gastronomía.");
    expect(feria!.url).toBe("https://example.com/eventos/poncho");
    expect(feria!.venueName).toBe("Predio Ferial");
    expect(feria!.address).toBe("Av. Alem 1000, Catamarca");

    expect(sinfonica!.title).toBe("Concierto Sinfónico");
    expect(sinfonica!.startsAt).toBe("2026-08-02T20:30:00.000Z");
  });

  it("lanza error si el fetch falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const source = createHtmlSource({
      key: "test-html",
      url: "https://example.com/agenda",
      userAgent: "HakuBot/test",
      wrapper: "article",
      titleSelector: "h2",
      dateSelector: "time",
    });
    await expect(source.fetch(new Date())).rejects.toThrow("HTTP 404");
  });
});
