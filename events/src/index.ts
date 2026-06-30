// API pública de @haku/events. Dos caras: LECTURA (web) e INGESTA (job/cron).

// Dominio
export type { Event, RawEvent } from "./domain/event.js";
export { normalize, dedupeHash } from "./domain/event.js";

// Ports
export type { EventSourcePort } from "./application/ports/event-source.port.js";
export type {
  EventRepository,
  ListUpcomingQuery,
  UpdateEventData,
} from "./application/ports/event-repository.port.js";

// Lectura (consumida por web vía ISR)
export {
  listUpcomingEvents,
  type ListUpcomingInput,
} from "./application/use-cases/list-upcoming-events.use-case.js";
export { getEventBySlug } from "./application/use-cases/get-event-by-slug.use-case.js";
// listEventCategories es simple: se consume directo desde el port vía el adapter en web.
export {
  searchEventsNearby,
  type SearchEventsNearbyInput,
} from "./application/use-cases/search-events-nearby.use-case.js";

// Moderación (admin)
export {
  listAllEvents,
  type ListAllEventsQuery,
} from "./application/use-cases/list-all-events.use-case.js";
export {
  updateEvent,
  type UpdateEventInput,
} from "./application/use-cases/update-event.use-case.js";
export { listPendingEvents } from "./application/use-cases/list-pending-events.use-case.js";
export {
  publishEvent,
  rejectEvent,
} from "./application/use-cases/moderate-event.use-cases.js";

// Ingesta (consumida por un job/cron, nunca por la UI directa)
export {
  runIngestion,
  type IngestionDeps,
  type IngestionSummary,
} from "./application/use-cases/run-ingestion.use-case.js";

// Infraestructura
export { createSupabaseEventRepository } from "./infrastructure/supabase-event.repository.js";
export {
  createHtmlSource,
  type HtmlSourceConfig,
} from "./infrastructure/sources/html.source.js";
export { createICalSource } from "./infrastructure/sources/ical.source.js";
export { createDemoSource, DEMO_SOURCE_KEY } from "./infrastructure/sources/demo.source.js";
