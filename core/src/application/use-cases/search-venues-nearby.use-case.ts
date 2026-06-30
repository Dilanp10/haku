import { z } from "zod";
import {
  type Result,
  ok,
  err,
  ValidationError,
  UnexpectedError,
  geoPointSchema,
} from "@haku/shared";
import type { CoreRepository } from "../ports/core-repository.port.js";
import type { Venue } from "../../domain/venue.js";

const inputSchema = z.object({
  point: geoPointSchema,
  radiusKm: z.number().positive().max(50).default(5),
  limit: z.number().int().min(1).max(100).default(20),
});

export type SearchVenuesNearbyInput = z.input<typeof inputSchema>;

export async function searchVenuesNearby(
  repo: CoreRepository,
  input: SearchVenuesNearbyInput,
): Promise<Result<Venue[]>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return err(new ValidationError("Parámetros de búsqueda inválidos", parsed.error.issues));
  }
  try {
    return ok(await repo.searchVenuesNearby(parsed.data.point, parsed.data.radiusKm, parsed.data.limit));
  } catch (cause) {
    return err(new UnexpectedError("Error en búsqueda por cercanía", cause));
  }
}
