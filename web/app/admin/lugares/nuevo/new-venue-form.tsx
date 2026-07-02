"use client";

import { useActionState, useState, useRef } from "react";
import type { Category, FoodType } from "@haku/core";
import { createVenueAction, type CreateVenueState } from "./actions";

const initial: CreateVenueState = {};

const inputStyle: React.CSSProperties = {
  background: "var(--card-bg)",
  border: "1px solid var(--line-2)",
  color: "var(--fg)",
};
const inputCls =
  "mt-1 w-full rounded-[10px] px-3 py-2.5 text-sm outline-none transition focus:ring-2";

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
    if (!slugLocked.current) setSlug(slugify(e.target.value));
  }
  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    slugLocked.current = true;
    setSlug(e.target.value);
  }
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <form action={action} className="space-y-8">
      {/* BÁSICO */}
      <Section title="Básico">
        <Field label="Nombre" required>
          <input name="name" type="text" required placeholder="Café del Valle" onChange={handleNameChange} className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Slug (URL amigable)" required>
          <input name="slug" type="text" required value={slug} onChange={handleSlugChange} placeholder="cafe-del-valle" className={inputCls} style={inputStyle} />
          <span className="mt-1 block text-xs" style={{ color: "var(--fg-30)" }}>
            Solo minúsculas, números y guiones. Se auto-genera desde el nombre.
          </span>
        </Field>
        <Field label="Descripción">
          <textarea name="description" rows={3} className={inputCls + " resize-none"} style={inputStyle} />
        </Field>
        <Field label="Categoría" required>
          <select name="categorySlug" required defaultValue="" className={inputCls} style={inputStyle}>
            <option value="" disabled>— sin categoría —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </Field>
      </Section>

      {/* UBICACIÓN */}
      <Section title="Ubicación">
        <Field label="Dirección">
          <input name="address" type="text" placeholder="San Martín 100" className={inputCls} style={inputStyle} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitud">
            <input name="lat" type="number" step="any" placeholder="-28.4696" className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Longitud">
            <input name="lng" type="number" step="any" placeholder="-65.7795" className={inputCls} style={inputStyle} />
          </Field>
        </div>
        <p className="text-xs" style={{ color: "var(--fg-30)" }}>
          Tip: en Google Maps, click derecho sobre el local → copiá las coordenadas.
        </p>
      </Section>

      {/* CONTACTO */}
      <Section title="Contacto">
        <Field label="Teléfono">
          <input name="phone" type="tel" placeholder="0383 15..." className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Sitio web">
          <input name="website" type="url" placeholder="https://..." className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Instagram (usuario o URL)">
          <input name="instagram" type="text" placeholder="@usuario" className={inputCls} style={inputStyle} />
        </Field>
      </Section>

      {/* IMAGEN */}
      <Section title="Imagen">
        {preview && (
          <img src={preview} alt="Preview" className="mb-2 aspect-[16/9] w-full rounded-[10px] object-cover" />
        )}
        <input
          type="file"
          name="coverImage"
          accept="image/*"
          onChange={handleImageChange}
          className="block w-full text-sm file:mr-3 file:rounded-[8px] file:border-0 file:px-3 file:py-1.5 file:text-sm file:font-medium"
          style={{ color: "var(--fg-50)" }}
        />
      </Section>

      {/* TIPOS DE COMIDA */}
      {foodTypes.length > 0 && (
        <Section title="Tipos de comida">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {foodTypes.map((ft) => (
              <label key={ft.id} className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--fg-70)" }}>
                <input type="checkbox" name="foodTypeId" value={ft.id} className="h-4 w-4 rounded accent-[var(--terra)]" />
                {ft.name}
              </label>
            ))}
          </div>
        </Section>
      )}

      {/* ESTADO */}
      <Section title="Estado">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Precio">
            <select name="priceRange" defaultValue="" className={inputCls} style={inputStyle}>
              <option value="">-</option>
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
            </select>
          </Field>
          <Field label="Estado">
            <select name="status" defaultValue="draft" className={inputCls} style={inputStyle}>
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
          </Field>
        </div>
      </Section>

      {state.error ? (
        <p
          className="rounded-[10px] border px-4 py-2 text-sm"
          style={{ borderColor: "var(--rust)", color: "var(--rust)", background: "var(--card-bg)" }}
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-[10px] px-5 py-2.5 text-sm font-medium transition active:opacity-80 disabled:opacity-50"
          style={{ background: "var(--terra)", color: "#fff" }}
        >
          {pending ? "Guardando..." : "Crear lugar"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-section mb-3">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium" style={{ color: "var(--fg-70)" }}>
        {label}
        {required && <span style={{ color: "var(--terra)" }}> *</span>}
      </span>
      {children}
    </label>
  );
}
