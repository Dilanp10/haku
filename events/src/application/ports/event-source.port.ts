import type { RawEvent } from "../../domain/event.js";

/** Un scraper/fuente. Solo obtiene datos crudos; nunca toca la base de datos. */
export interface EventSourcePort {
  readonly key: string;
  fetch(now: Date): Promise<RawEvent[]>;
}
