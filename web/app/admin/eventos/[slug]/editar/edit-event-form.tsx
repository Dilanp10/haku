"use client";

import { useActionState } from "react";
import type { Event } from "@haku/events";
import { updateEventAction, type UpdateEventState } from "./actions";

const initial: UpdateEventState = {};

// Convierte ISO -> valor para <input type="datetime-local">
const toLocal = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // YYYY-MM-DDTHH:mm
  return d.toISOString().slice(0, 16);
};

const STATUS_LABELS = {
  pending: "Pendiente",
  published: "Publicado",
  rejected: "Rechazado",
} as const;

export function EditEventForm({ event }: { event: Event }) {
  const [state, action, pending] = useActionState(updateEventAction, initial);

  return (
    <form action={action} className="space-y-5 rounded-lg border bg-card p-6">
      <input type="hidden" name="id" value={event.id} />
      <input type="hidden" name="slug" value={event.slug} />

      <Row label="Titulo *" name="title" required defaultValue={event.title} />

      <label className="block">
        <span className="text-sm font-medium">Descripcion</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={event.description ?? ""}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
        <span className="mt-0.5 block text-xs text-muted-foreground">Dejar vacio para limpiar.</span>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Inicio *</span>
          <input
            type="datetime-local"
            name="startsAt"
            required
            defaultValue={toLocal(event.startsAt)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Fin</span>
          <input
            type="datetime-local"
            name="endsAt"
            defaultValue={event.endsAt ? toLocal(event.endsAt) : ""}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>

      <Row label="Lugar / Venue" name="venueName" defaultValue={event.venueName ?? ""} />
      <Row label="Direccion" name="address" defaultValue={event.address ?? ""} />
      <Row
        label="URL externa"
        name="url"
        type="url"
        defaultValue={event.url ?? ""}
        placeholder="https://..."
      />
      <Row label="Categoria" name="category" defaultValue={event.category ?? ""} />

      <label className="block">
        <span className="text-sm font-medium">Estado</span>
        <select
          name="status"
          defaultValue={event.status}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {(["pending", "published", "rejected"] as const).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-md border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <span className="font-medium">Slug (no editable):</span> {event.slug}
        <span className="ml-4 font-medium">Fuente:</span> {event.sourceKey}
      </div>

      {state.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

function Row({
  label,
  name,
  required,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean | undefined;
  type?: string | undefined;
  defaultValue?: string | undefined;
  placeholder?: string | undefined;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
      />
    </label>
  );
}
