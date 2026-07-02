import { z } from "zod";
import {
  type Result,
  ok,
  err,
  ValidationError,
  ConflictError,
  UnexpectedError,
  slugSchema,
} from "@haku/shared";
import type { CoreRepository } from "../ports/core-repository.port";
import type { Venue } from "../../domain/venue";

const inputSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  categorySlug: z.string().min(1),
  address: z.string().trim().max(240).optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
  priceRange: z.enum(["$", "$$", "$$$"]).optional(),
  phone: z.string().trim().max(30).optional(),
  website: z.string().trim().url().max(200).optional(),
  instagram: z.string().trim().max(60).optional(),
  coverImageUrl: z.string().trim().url().max(500).optional(),
  foodTypeIds: z.array(z.string().uuid()).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});
export type CreateVenueInput = z.input<typeof inputSchema>;

/**
 * Caso de uso de creación de venue. La autorización (rol admin) se verifica en `web`
 * antes de invocar este use-case; aquí solo se valida la entrada y se delega al port.
 */
export async function createVenue(
  repo: CoreRepository,
  input: CreateVenueInput,
): Promise<Result<Venue>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return err(new ValidationError("Datos de lugar inválidos", parsed.error.issues));
  }
  try {
    return ok(await repo.createVenue(parsed.data));
  } catch (cause) {
    // El adapter convierte el unique-violation de Postgres en ConflictError.
    if (cause instanceof ConflictError) return err(cause);
    return err(new UnexpectedError("No se pudo crear el lugar", cause));
  }
}
