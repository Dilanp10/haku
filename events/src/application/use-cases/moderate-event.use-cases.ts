import { z } from "zod";
import {
  type Result,
  ok,
  err,
  ValidationError,
  NotFoundError,
  UnexpectedError,
} from "@haku/shared";
import type { EventRepository } from "../ports/event-repository.port";
import type { Event } from "../../domain/event";

const idSchema = z.object({ id: z.string().uuid() });

async function transition(
  repo: EventRepository,
  input: { id: string },
  to: "published" | "rejected",
): Promise<Result<Event>> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return err(new ValidationError("Id inválido", parsed.error.issues));
  try {
    return ok(await repo.updateStatus(parsed.data.id, to));
  } catch (cause) {
    if (cause instanceof NotFoundError) return err(cause);
    return err(new UnexpectedError(`No se pudo cambiar el estado a ${to}`, cause));
  }
}

/** Pasa un evento `pending` → `published`. La autorización (admin) se hace en `web`. */
export function publishEvent(repo: EventRepository, input: { id: string }) {
  return transition(repo, input, "published");
}

/** Pasa un evento `pending` → `rejected`. */
export function rejectEvent(repo: EventRepository, input: { id: string }) {
  return transition(repo, input, "rejected");
}
