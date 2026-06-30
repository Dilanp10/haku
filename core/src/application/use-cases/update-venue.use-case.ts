import { z } from "zod";
import {
  type Result,
  ok,
  err,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnexpectedError,
} from "@haku/shared";
import type { CoreRepository, UpdateVenueData } from "../ports/core-repository.port.js";
import type { Venue } from "../../domain/venue.js";

const dataSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  categorySlug: z.string().min(1).optional(),
  address: z.string().trim().max(240).nullable().optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).nullable().optional(),
  priceRange: z.enum(["$", "$$", "$$$"]).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  website: z.string().trim().url().max(200).nullable().optional(),
  instagram: z.string().trim().max(60).nullable().optional(),
  coverImageUrl: z.string().trim().url().max(500).nullable().optional(),
  foodTypeIds: z.array(z.string().uuid()).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

const inputSchema = z
  .object({ id: z.string().uuid() })
  .and(dataSchema);

export type UpdateVenueInput = z.input<typeof inputSchema>;

/**
 * Edita un venue existente. `undefined` = no cambia; `null` = limpia el campo
 * (donde el modelo lo permita). El slug no es editable (ver spec 005).
 */
export async function updateVenue(
  repo: CoreRepository,
  input: UpdateVenueInput,
): Promise<Result<Venue>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return err(new ValidationError("Datos de edición inválidos", parsed.error.issues));
  }
  const { id, ...data } = parsed.data;

  try {
    return ok(await repo.updateVenue(id, data as UpdateVenueData));
  } catch (cause) {
    if (cause instanceof NotFoundError) return err(cause);
    if (cause instanceof ConflictError) return err(cause);
    return err(new UnexpectedError("No se pudo actualizar el lugar", cause));
  }
}
