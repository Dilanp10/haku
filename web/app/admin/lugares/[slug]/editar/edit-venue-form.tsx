"use client";

import { useState, useActionState } from "react";
import Image from "next/image";
import type { Category, FoodType, Venue } from "@haku/core";
import { updateVenueAction, type UpdateVenueState } from "./actions";
import { HoursField } from "./hours-field";

const initial: UpdateVenueState = {};

interface HourRow {
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  closed: boolean;
}

export function EditVenueForm({
  venue,
  categories,
  foodTypes,
  currentCategorySlug,
  initialHours = [],
}: {
  venue: Venue;
  categories: Category[];
  foodTypes: FoodType[];
  currentCategorySlug?: string | undefined;
  initialHours?: HourRow[];
}) {
  const [state, action, pending] = useActionState(updateVenueAction, initial);

  return (
    <form action={action} className="space-y-5 rounded-lg border bg-card p-6">
      <input type="hidden" name="id" value={venue.id} />
      <input type="hidden" name="slug" value={venue.slug} />

      <Row label="Nombre *" name="name" required defaultValue={venue.name} />

      <label className="block">
        <span className="text-sm font-medium">Slug (no editable)</span>
        <input
          readOnly
          disabled
          value={venue.slug}
          className="mt-1 w-full rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Categoría *</span>
        <select
          required
          name="categorySlug"
          defaultValue={currentCategorySlug ?? ""}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="" disabled>Elegí una…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Descripción</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={venue.description ?? ""}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
        <span className="mt-1 block text-xs text-muted-foreground">Dejar vacío para limpiar.</span>
      </label>

      {/* Cover image */}
      <CoverImageField currentUrl={venue.coverImageUrl ?? null} />

      <Row label="Dirección" name="address" defaultValue={venue.address ?? ""} />

      <div className="grid grid-cols-2 gap-4">
        <Row label="Latitud" name="lat" type="number" step="any" defaultValue={venue.location?.lat ?? ""} />
        <Row label="Longitud" name="lng" type="number" step="any" defaultValue={venue.location?.lng ?? ""} />
      </div>

      {/* Tipos de comida */}
      {foodTypes.length > 0 && (
        <fieldset className="rounded-md border p-4">
          <legend className="px-1 text-sm font-semibold text-muted-foreground">Qué encontrás</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {foodTypes.map((ft) => (
              <label key={ft.id} className="flex cursor-pointer items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  name="foodTypeId"
                  value={ft.id}
                  defaultChecked={venue.foodTypeIds.includes(ft.id)}
                  className="rounded"
                />
                {ft.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Contacto */}
      <fieldset className="space-y-3 rounded-md border p-4">
        <legend className="px-1 text-sm font-semibold text-muted-foreground">Contacto</legend>
        <Row label="Teléfono" name="phone" type="tel" defaultValue={venue.phone ?? ""} />
        <Row label="Sitio web" name="website" type="url" defaultValue={venue.website ?? ""} placeholder="https://…" />
        <Row label="Instagram" name="instagram" defaultValue={venue.instagram ?? ""} placeholder="@usuario" />
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Precio</span>
          <select
            name="priceRange"
            defaultValue={venue.priceRange ?? ""}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">—</option>
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Estado</span>
          <select
            name="status"
            defaultValue={venue.status}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
          </select>
        </label>
      </div>

      <HoursField initialHours={initialHours} />

      {state.error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

function CoverImageField({ currentUrl }: { currentUrl: string | null }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);

  const displayed = cleared ? null : (preview ?? currentUrl);

  return (
    <fieldset className="space-y-3 rounded-md border p-4">
      <legend className="px-1 text-sm font-semibold text-muted-foreground">Imagen de portada</legend>

      {displayed && (
        <div className="relative h-40 w-full overflow-hidden rounded-md border bg-muted">
          <Image src={displayed} alt="Portada actual" fill className="object-cover" unoptimized />
        </div>
      )}

      <input
        type="file"
        name="coverImage"
        accept="image/*"
        className="block text-sm"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setCleared(false);
            setPreview(URL.createObjectURL(file));
          }
        }}
      />

      {currentUrl && !cleared && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="clearCoverImage"
            value="1"
            onChange={(e) => {
              setCleared(e.target.checked);
              if (e.target.checked) setPreview(null);
            }}
          />
          Eliminar imagen actual
        </label>
      )}

      <p className="text-xs text-muted-foreground">
        Formatos: JPG, PNG, WebP. Tamano recomendado: 1200 x 630 px.
      </p>
    </fieldset>
  );
}

function Row({
  label,
  name,
  required,
  type = "text",
  step,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean | undefined;
  type?: string | undefined;
  step?: string | undefined;
  defaultValue?: string | number | undefined;
  placeholder?: string | undefined;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        step={step}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
      />
    </label>
  );
}
