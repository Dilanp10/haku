import type { Event } from "../../domain/event";
import type { EventStatus, GeoPoint } from "@haku/shared";

export interface ListUpcomingQuery {
  from?: string; // ISO; default = ahora
  category?: string;
  search?: string;
  limit: number;
}

export interface UpdateEventData {
  title?: string | undefined;
  description?: string | null | undefined;
  startsAt?: string | undefined;
  endsAt?: string | null | undefined;
  venueName?: string | null | undefined;
  address?: string | null | undefined;
  url?: string | null | undefined;
  category?: string | null | undefined;
  status?: EventStatus | undefined;
}

export interface EventRepository {
  upsertMany(events: Omit<Event, "id" | "ingestedAt">[]): Promise<{ inserted: number; updated: number }>;
  listUpcoming(q: ListUpcomingQuery): Promise<Event[]>;
  listEventCategories(): Promise<string[]>;
  listAll(status: EventStatus | null, limit: number, includePast?: boolean): Promise<Event[]>;
  getBySlug(slug: string): Promise<Event | null>;
  listPending(limit: number): Promise<Event[]>;
  update(id: string, data: UpdateEventData): Promise<Event>;
  updateStatus(id: string, status: EventStatus): Promise<Event>;
  listNearby(point: GeoPoint, radiusKm: number, limit: number): Promise<Event[]>;
}
