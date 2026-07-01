import { type Result, ok, err, UnexpectedError } from "@haku/shared";
import type { EventRepository } from "../ports/event-repository.port";
import type { Event } from "../../domain/event";

/**
 * Lista eventos `pending` para moderación admin. La autorización del rol admin
 * se verifica en `web` antes de invocar este use-case; la RLS de Postgres es la
 * barrera real (un visitor anónimo no recibe nada aunque llame al port).
 */
export async function listPendingEvents(
  repo: EventRepository,
  limit = 50,
): Promise<Result<Event[]>> {
  try {
    return ok(await repo.listPending(Math.min(Math.max(limit, 1), 200)));
  } catch (cause) {
    return err(new UnexpectedError("Error listando eventos pendientes", cause));
  }
}
