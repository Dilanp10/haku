"use client";

import { useActionState } from "react";
import { createEventAction, type CreateEventState } from "./actions";

const initial: CreateEventState = {};

export function NewEventForm() {
  const [state, action, pending] = useActionState(createEventAction, initial);

  return (
    <form action={action} className="space-y-5 rounded-lg border bg-card p-6">
      <Row label="Titulo *" name="title" required placeholder="Feria del Poncho 2026" />

      <label className="block">
        <span className="text-sm font-medium">Descripcion</span>
        <textarea
          name="description"
          rows={3}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <Row label="Fecha inicio *" name="startsAt" type="datetime-local" required />
        <Row label="Fecha fin" name="endsAt" type="datetime-local" />
      </div>

      <Row label="Lugar" name="venueName" placeholder="Predio Ferial" />
      <Row label="Direccion" name="address" placeholder="Av. Virgen del Valle 100" />
      <Row label="URL externa" name="url" type="url" placeholder="https://..." />
      <Row label="Categoria" name="category" placeholder="cultura, musica, gastronomia..." />

      <label className="block">
        <span className="text-sm font-medium">Estado</span>
        <select
          name="status"
          defaultValue="published"
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="published">Publicado</option>
          <option value="pending">Pendiente</option>
          <option value="rejected">Rechazado</option>
        </select>
      </label>

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
        {pending ? "Creando..." : "Crear evento"}
      </button>
    </form>
  );
}

function Row({
  label,
  name,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
      />
    </label>
  );
}
