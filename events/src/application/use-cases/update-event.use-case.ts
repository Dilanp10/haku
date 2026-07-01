import { z } from "zod";
import { type Result, ok, err, ValidationError, UnexpectedError } from "@haku/shared";
import type { EventRepository, UpdateEventData } from "../ports/event-repository.port";
import type { Event } from "../../domain/event";

const schema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).nullable().optional(),
  startsAt: z.string().datetime({ offset: true }).optional(),
  endsAt: z.string().datetime({ offset: true }).nullable().optional(),
  venueName: z.string().max(200).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  url: z.string().url().max(2000).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  status: z.enum(["pending", "published", "rejected"]).optional(),
});

export type UpdateEventInput = z.input<typeof schema>;

export async function updateEvent(
  repo: EventRepository,
  input: UpdateEventInput,
): Promise<Result<Event>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error.issues[0]?.message ?? "Datos invalidos"));
  }
  const { id, ...data } = parsed.data;
  try {
    return ok(await repo.update(id, data as UpdateEventData));
  } catch (cause) {
    return err(new UnexpectedError("Error actualizando evento", cause));
  }
}
