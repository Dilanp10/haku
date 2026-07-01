import { z } from "zod";
import { type Result, ok, err, ValidationError, UnexpectedError } from "@haku/shared";
import type { EventRepository } from "../ports/event-repository.port";
import { normalize, type RawEvent } from "../../domain/event";

const schema = z.object({
  title: z.string().min(1, "El titulo es obligatorio").max(300),
  description: z.string().max(2000).optional(),
  startsAt: z.string().min(1, "La fecha de inicio es obligatoria"),
  endsAt: z.string().optional(),
  venueName: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  url: z.string().url().max(2000).optional(),
  category: z.string().max(100).optional(),
  status: z.enum(["pending", "published", "rejected"]).optional(),
});

export type CreateEventInput = z.input<typeof schema>;

export async function createEvent(
  repo: EventRepository,
  input: CreateEventInput,
): Promise<Result<{ slug: string }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error.issues[0]?.message ?? "Datos invalidos"));
  }

  const data = parsed.data;
  const raw: RawEvent = {
    sourceKey: "manual",
    title: data.title,
    startsAt: data.startsAt,
  };
  if (data.description !== undefined) raw.description = data.description;
  if (data.endsAt !== undefined) raw.endsAt = data.endsAt;
  if (data.venueName !== undefined) raw.venueName = data.venueName;
  if (data.address !== undefined) raw.address = data.address;
  if (data.url !== undefined) raw.url = data.url;
  if (data.category !== undefined) raw.category = data.category;
  const normalized = normalize(raw);

  const withStatus = { ...normalized, status: data.status ?? "published" as const };

  try {
    await repo.upsertMany([withStatus]);
    return ok({ slug: withStatus.slug });
  } catch (cause) {
    return err(new UnexpectedError("Error creando evento", cause));
  }
}
