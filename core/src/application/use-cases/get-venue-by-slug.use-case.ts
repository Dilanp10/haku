import { z } from "zod";
import {
  type Result,
  ok,
  err,
  ValidationError,
  NotFoundError,
  UnexpectedError,
  slugSchema,
} from "@haku/shared";
import type { CoreRepository } from "../ports/core-repository.port";
import type { Venue } from "../../domain/venue";

const inputSchema = z.object({ slug: slugSchema });

export async function getVenueBySlug(
  repo: CoreRepository,
  input: { slug: string },
): Promise<Result<Venue>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return err(new ValidationError("Slug inválido", parsed.error.issues));
  }
  try {
    const venue = await repo.getVenueBySlug(parsed.data.slug);
    return venue ? ok(venue) : err(new NotFoundError(`No existe el lugar '${parsed.data.slug}'`));
  } catch (cause) {
    return err(new UnexpectedError("Error obteniendo el lugar", cause));
  }
}
