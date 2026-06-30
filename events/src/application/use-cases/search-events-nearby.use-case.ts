import { z } from "zod";
import {
  type Result,
  ok,
  err,
  ValidationError,
  UnexpectedError,
  geoPointSchema,
} from "@haku/shared";
import type { EventRepository } from "../ports/event-repository.port.js";
import type { Event } from "../../domain/event.js";

const inputSchema = z.object({
  point: geoPointSchema,
  radiusKm: z.number().positive().max(50).default(10),
  limit: z.number().int().min(1).max(100).default(20),
});

export type SearchEventsNearbyInput = z.input<typeof inputSchema>;

export async function searchEventsNearby(
  repo: EventRepository,
  input: SearchEventsNearbyInput,
): Promise<Result<Event[]>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return err(new ValidationError("Parámetros de búsqueda inválidos", parsed.error.issues));
  }
  try {
    return ok(await repo.listNearby(parsed.data.point, parsed.data.radiusKm, parsed.data.limit));
  } catch (cause) {
    return err(new UnexpectedError("Error en búsqueda de eventos por cercanía", cause));
  }
}
