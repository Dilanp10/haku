"use client";

import { useActionState, useState, useRef } from "react";
import type { Category, FoodType } from "@haku/core";
import { createVenueAction, type CreateVenueState } from "./actions";

const initial: CreateVenueState = {};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function NewVenueForm({
  categories,
  foodTypes,
}: {
  categories: Category[];
  foodTypes: FoodType[];
}) {
  const [state, action, pending] = useActionState(createVenueAction, initial);
  const [slug, setSlug] = useState("");
  const slugLocked = useRef(false);
  const [preview, setPreview] = useState<string | null>(null);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugLocked.current) {
      setSlug(slugify(e.target.value));
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    slugLocked.current = true;
    setSlug(e.target.value);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  return (
    <form action={action} className="space-y-5 rounded-lg border bg-card p-6">
      <Row label="Nombre *" name="name" required placeholder="Cafe del Valle" onChange={handleNameChange} />

      <label className="block">
        <span className="text-sm font-medium">Slug *</span>
        <input
          name="slug"
          type="text"
          required
          value={slug}
          onChange={handleSlugChange}
          placeholder="cafe-del-valle"
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          Solo minúsculas, números y guiones. Se auto-genera desde el nombre.
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Categoría *</span>
        <select
          required
          name="categorySlug"
          defaultValue=""
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="" disabled>Elegí una...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Descripción</span>
        <textarea
          name="description"
          rows={3}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
        />
      </label>

      <Row label="Dirección" name="address" placeholder="San Martín 100" />

      <div className="grid grid-cols-2 gap-4">
        <Row label="Latitud" name="lat" type="number" step="any" placeholder="-28.4696" />
        <Row label="Longitud" name="lng" type="number" step="any" placeholder="-65.7795" />
      </div>

      {foodTypes.length > 0 && (
        <fieldset className="rounded-md border p-4">
          <legend className="px-1 text-sm font-semibold text-muted-foreground">Qué encontrás</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {foodTypes.map((ft) => (
              <label key={ft.id} className="flex cursor-pointer items-center gap-1.5 text-sm">
                <input type="checkbox" name="foodTypeId" value={ft.id} className="rounded" />
                {ft.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-3 rounded-md border p-4">
        <legend className="px-1 text-sm font-semibold text-muted-foreground">Contacto</legend>
        <Row label="Teléfono" name="phone" type="tel" placeholder="0383 15..." />
        <Row label="Sitio web" name="website" type="url" placeholder="https://..." />
        <Row label="Instagram" name="instagram" placeholder="@usuario" />
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Precio</span>
          <select name="priceRange" defaultValue="" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="">-</option>
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Estado</span>
          <select name="status" defaultValue="draft" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Imagen de portada</span>
        {preview && (
          <img src={preview} alt="Preview" className="mt-2 h-32 w-full rounded-md object-cover" />
        )}
        <input
          type="file"
          name="coverImage"
          accept="image/*"
          onChange={handleImageChange}
          className="mt-1 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-sm hover:file:border-primary/40"
        />
      </label>

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
        {pending ? "Guardando..." : "Crear lugar"}
      </button>
    </form>
  );
}

function Row({
  label,
  name,
  required,
  type = "text",
  step,
  placeholder,
  onChange,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  step?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        step={step}
        placeholder={placeholder}
        onChange={onChange}
        className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
      />
    </label>
  );
}
