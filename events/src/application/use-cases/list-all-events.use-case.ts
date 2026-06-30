import { type Result, ok, err, UnexpectedError } from "@haku/shared";
import type { EventStatus } from "@haku/shared";
import type { EventRepository } from "../ports/event-repository.port.js";
import type { Event } from "../../domain/event.js";

export interface ListAllEventsQuery {
  status?: EventStatus | undefined;
  limit?: number | undefined;
}

export async function listAllEvents(
  repo: EventRepository,
  query: ListAllEventsQuery = {},
): Promise<Result<Event[]>> {
  try {
    const limit = Math.min(Math.max(query.limit ?? 100, 1), 500);
    return ok(await repo.listAll(query.status ?? null, limit));
  } catch (cause) {
    return err(new UnexpectedError("Error listando eventos", cause));
  }
}
