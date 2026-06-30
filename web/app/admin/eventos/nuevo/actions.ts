"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createEvent } from "@haku/events";
import { createSupabaseEventRepository } from "@haku/events";
import { ValidationError } from "@haku/shared";
import { requireProfile } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { sendNewEventNotifications } from "@/lib/push/send-notifications";

export interface CreateEventState {
  error?: string;
}

export async function createEventAction(
  _prev: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  await requireProfile("admin");

  const input = {
    title: str(formData.get("title")),
    description: optional(formData.get("description")),
    startsAt: toISO(str(formData.get("startsAt"))),
    endsAt: optionalISO(optional(formData.get("endsAt"))),
    venueName: optional(formData.get("venueName")),
    address: optional(formData.get("address")),
    url: optional(formData.get("url")),
    category: optional(formData.get("category")),
    status: str(formData.get("status")) as "pending" | "published" | "rejected" | undefined,
  };

  const adminClient = createAdminSupabase();
  const repo = createSupabaseEventRepository(adminClient);
  const res = await createEvent(repo, input);

  if (!res.ok) {
    if (res.error instanceof ValidationError) {
      return { error: res.error.message };
    }
    return { error: "Error inesperado al crear el evento." };
  }

  if (input.status !== "pending" && input.status !== "rejected") {
    sendNewEventNotifications([{ title: input.title, slug: res.value.slug }]).catch(() => {});
  }

  revalidatePath("/admin/eventos");
  revalidatePath("/eventos");
  redirect("/admin/eventos");
}

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function optional(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

function toISO(v: string): string {
  if (!v) return "";
  if (v.includes("T") && v.includes(":") && !v.includes("Z") && !v.includes("+")) {
    return v + ":00-03:00";
  }
  return v;
}

function optionalISO(v: string | undefined): string | undefined {
  if (!v) return undefined;
  return toISO(v);
}
