import { type Result, ok, err, UnexpectedError } from "@haku/shared";
import type { EventStatus } from "@haku/shared";
import type { EventRepository } from "../ports/event-repository.port";
import type { Event } from "../../domain/event";

export interface ListAllEventsQuery {
  status?: EventStatus | undefined;
  limit?: number | undefined;
  includePast?: boolean | undefined;
}

export async function listAllEvents(
  repo: EventRepository,
  query: ListAllEventsQuery = {},
): Promise<Result<Event[]>> {
  try {
    const limit = Math.min(Math.max(query.limit ?? 100, 1), 500);
    return ok(await repo.listAll(query.status ?? null, limit, query.includePast ?? false));
  } catch (cause) {
    return err(new UnexpectedError("Error listando eventos", cause));
  }
}
