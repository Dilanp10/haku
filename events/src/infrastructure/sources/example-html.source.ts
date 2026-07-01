import * as cheerio from "cheerio";
import type { EventSourcePort } from "../../application/ports/event-source.port";
import type { RawEvent } from "../../domain/event";

export interface HtmlSourceConfig {
  key: string;
  url: string;
  userAgent: string;
}

/**
 * Plantilla de scraper HTML (cortés: User-Agent identificable).
 * SCAFFOLD (SDD, Fase 3): los selectores reales dependen de cada fuente de Catamarca;
 * se añadirá al menos un scraper concreto al construir el módulo. Demuestra el contrato
 * `EventSourcePort`: obtiene datos crudos y NO toca la base de datos.
 */
export function createHtmlSource(config: HtmlSourceConfig): EventSourcePort {
  return {
    key: config.key,
    async fetch(_now: Date): Promise<RawEvent[]> {
      const res = await fetch(config.url, {
        headers: { "user-agent": config.userAgent },
      });
      if (!res.ok) throw new Error(`Fuente ${config.key}: HTTP ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);

      // TODO(Fase 3): mapear el markup real de la fuente a RawEvent[].
      void $;
      return [];
    },
  };
}
