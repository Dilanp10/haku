"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { suggestVenueAction, type SuggestState } from "./actions";
import type { Category } from "@haku/core";

const initial: SuggestState = { status: "idle" };

export function SuggestForm({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(suggestVenueAction, initial);

  if (state.status === "success") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center dark:border-green-900 dark:bg-green-950/30">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600 dark:text-green-400" />
        <h2 className="mt-4 text-xl font-bold">¡Gracias por tu sugerencia!</h2>
        <p className="mt-2 text-muted-foreground">
          <span className="font-semibold">{state.name}</span> fue recibido y está siendo revisado por nuestro equipo.
          Lo publicaremos en los próximos días si cumple con los criterios del directorio.
        </p>
      </div>
    );
  }

  const fe = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="space-y-5">
      {state.status === "error" && !state.fieldErrors && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <Field label="Nombre del lugar *" error={fe["name"]?.[0]}>
        <input
          name="name"
          type="text"
          required
          maxLength={120}
          placeholder="Ej. Café del Valle"
          className={inputCls(!!fe["name"])}
        />
      </Field>

      <Field label="Categoría *" error={fe["categorySlug"]?.[0]}>
        <select name="categorySlug" required defaultValue="" className={inputCls(!!fe["categorySlug"])}>
          <option value="" disabled>Elegí una categoría…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Dirección" error={fe["address"]?.[0]}>
        <input
          name="address"
          type="text"
          maxLength={240}
          placeholder="Ej. San Martín 100, S. F. del Valle de Catamarca"
          className={inputCls(!!fe["address"])}
        />
      </Field>

      <Field label="Descripción" error={fe["description"]?.[0]}>
        <textarea
          name="description"
          rows={3}
          maxLength={2000}
          placeholder="Contanos brevemente qué hace especial a este lugar…"
          className={inputCls(!!fe["description"]) + " resize-none"}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Teléfono" error={fe["phone"]?.[0]}>
          <input name="phone" type="tel" maxLength={30} placeholder="0383 15…" className={inputCls(!!fe["phone"])} />
        </Field>
        <Field label="Sitio web" error={fe["website"]?.[0]}>
          <input name="website" type="url" maxLength={200} placeholder="https://…" className={inputCls(!!fe["website"])} />
        </Field>
        <Field label="Instagram" error={fe["instagram"]?.[0]}>
          <input name="instagram" type="text" maxLength={60} placeholder="@usuario" className={inputCls(!!fe["instagram"])} />
        </Field>
      </div>

      <p className="text-xs text-muted-foreground">
        * Campos obligatorios. Tu sugerencia quedará pendiente de revisión antes de publicarse.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar sugerencia"}
      </button>
    </form>
  );
}

function inputCls(error: boolean) {
  return `w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-ring ${
    error ? "border-destructive" : ""
  }`;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
