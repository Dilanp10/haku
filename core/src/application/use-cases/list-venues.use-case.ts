import { z } from "zod";
import {
  type Result,
  ok,
  err,
  ValidationError,
  UnexpectedError,
  paginationSchema,
} from "@haku/shared";
import type {
  CoreRepository,
  ListVenuesQuery,
  Paginated,
} from "../ports/core-repository.port";
import type { Venue } from "../../domain/venue";

const inputSchema = z.object({
  categorySlug: z.string().optional(),
  categorySlugs: z.array(z.string()).optional(),
  foodTypeSlug: z.string().optional(),
  foodTypeSlugs: z.array(z.string()).optional(),
  priceRange: z.enum(["$", "$$", "$$$"]).optional(),
  priceRanges: z.array(z.enum(["$", "$$", "$$$"])).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  openNow: z.boolean().optional(),
  attributes: z.array(z.string()).optional(),
  pagination: paginationSchema.optional(),
});
export type ListVenuesInput = z.input<typeof inputSchema>;

/**
 * Lista venues publicados aplicando filtros. La RLS de Supabase garantiza que solo
 * se devuelvan filas `status='published'` con la anon key.
 *
 * NOTA (SDD): firma + validación definidas; la orquestación final se completa en Fase 1.
 */
export async function listVenues(
  repo: CoreRepository,
  input: ListVenuesInput,
): Promise<Result<Paginated<Venue>>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return err(new ValidationError("Parámetros de listado inválidos", parsed.error.issues));
  }
  const { pagination, ...rest } = parsed.data;
  const query: ListVenuesQuery = {
    pagination: pagination ?? { page: 1, pageSize: 20 },
    ...(rest.categorySlug !== undefined ? { categorySlug: rest.categorySlug } : {}),
    ...(rest.foodTypeSlug !== undefined ? { foodTypeSlug: rest.foodTypeSlug } : {}),
    ...(rest.priceRange !== undefined ? { priceRange: rest.priceRange } : {}),
    ...(rest.search !== undefined ? { search: rest.search } : {}),
    ...(rest.status !== undefined ? { status: rest.status } : {}),
    ...(rest.openNow !== undefined ? { openNow: rest.openNow } : {}),
    ...(rest.categorySlugs !== undefined ? { categorySlugs: rest.categorySlugs } : {}),
    ...(rest.foodTypeSlugs !== undefined ? { foodTypeSlugs: rest.foodTypeSlugs } : {}),
    ...(rest.priceRanges !== undefined ? { priceRanges: rest.priceRanges } : {}),
    ...(rest.attributes !== undefined ? { attributes: rest.attributes } : {}),
  };
  try {
    return ok(await repo.listVenues(query));
  } catch (cause) {
    return err(new UnexpectedError("No se pudieron listar los lugares", cause));
  }
}
