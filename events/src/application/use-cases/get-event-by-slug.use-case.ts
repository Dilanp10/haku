import { type Result, ok, err, NotFoundError, UnexpectedError } from "@haku/shared";
import type { EventRepository } from "../ports/event-repository.port";
import type { Event } from "../../domain/event";

export async function getEventBySlug(
  repo: EventRepository,
  slug: string,
): Promise<Result<Event>> {
  try {
    const ev = await repo.getBySlug(slug);
    return ev ? ok(ev) : err(new NotFoundError(`No existe el evento '${slug}'`));
  } catch (cause) {
    return err(new UnexpectedError("Error obteniendo el evento", cause));
  }
}
