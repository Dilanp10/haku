import { type Result, ok, err, UnexpectedError } from "@haku/shared";
import type { Event } from "../../domain/event.js";
import type { EventRepository, ListUpcomingQuery } from "../ports/event-repository.port.js";

export interface ListUpcomingInput {
  from?: string;
  category?: string;
  search?: string;
  limit?: number;
}

/** Lectura pública: próximos eventos publicados. La RLS limita a status='published'. */
export async function listUpcomingEvents(
  repo: EventRepository,
  input: ListUpcomingInput = {},
): Promise<Result<Event[]>> {
  const query: ListUpcomingQuery = {
    ...(input.from !== undefined ? { from: input.from } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.search !== undefined ? { search: input.search } : {}),
    limit: Math.min(Math.max(input.limit ?? 20, 1), 100),
  };
  try {
    return ok(await repo.listUpcoming(query));
  } catch (cause) {
    return err(new UnexpectedError("No se pudieron listar los eventos", cause));
  }
}
