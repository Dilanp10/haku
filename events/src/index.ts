// API pública de @haku/events. Dos caras: LECTURA (web) e INGESTA (job/cron).

// Dominio
export type { Event, RawEvent } from "./domain/event";
export { normalize, dedupeHash } from "./domain/event";

// Ports
export type { EventSourcePort } from "./application/ports/event-source.port";
export type {
  EventRepository,
  ListUpcomingQuery,
  UpdateEventData,
} from "./application/ports/event-repository.port";

// Lectura (consumida por web vía ISR)
export {
  listUpcomingEvents,
  type ListUpcomingInput,
} from "./application/use-cases/list-upcoming-events.use-case";
export { getEventBySlug } from "./application/use-cases/get-event-by-slug.use-case";
// listEventCategories es simple: se consume directo desde el port vía el adapter en web.
export {
  searchEventsNearby,
  type SearchEventsNearbyInput,
} from "./application/use-cases/search-events-nearby.use-case";

// Creación manual (admin)
export {
  createEvent,
  type CreateEventInput,
} from "./application/use-cases/create-event.use-case";

// Moderación (admin)
export {
  listAllEvents,
  type ListAllEventsQuery,
} from "./application/use-cases/list-all-events.use-case";
export {
  updateEvent,
  type UpdateEventInput,
} from "./application/use-cases/update-event.use-case";
export { listPendingEvents } from "./application/use-cases/list-pending-events.use-case";
export {
  publishEvent,
  rejectEvent,
} from "./application/use-cases/moderate-event.use-cases";

// Ingesta (consumida por un job/cron, nunca por la UI directa)
export {
  runIngestion,
  type IngestionDeps,
  type IngestionSummary,
} from "./application/use-cases/run-ingestion.use-case";

// Infraestructura
export { createSupabaseEventRepository } from "./infrastructure/supabase-event.repository";
export {
  createHtmlSource,
  type HtmlSourceConfig,
} from "./infrastructure/sources/html.source";
export { createICalSource } from "./infrastructure/sources/ical.source";
export { createDemoSource, DEMO_SOURCE_KEY } from "./infrastructure/sources/demo.source";
export {
  createSfvcAgendaSource,
  type SfvcAgendaSourceConfig,
} from "./infrastructure/sources/sfvc-agenda.source";
