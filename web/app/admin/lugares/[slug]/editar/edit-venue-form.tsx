"use client";

import { useState, useActionState } from "react";
import Image from "next/image";
import type { Category, FoodType, Venue } from "@haku/core";
import { updateVenueAction, type UpdateVenueState } from "./actions";
import { HoursField } from "./hours-field";

const initial: UpdateVenueState = {};

const inputStyle: React.CSSProperties = {
  background: "var(--card-bg)",
  border: "1px solid var(--line-2)",
  color: "var(--fg)",
};
const inputCls = "mt-1 w-full rounded-[10px] px-3 py-2.5 text-sm outline-none transition focus:ring-2";

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
    <form action={action} className="space-y-8">
      <input type="hidden" name="id" value={venue.id} />
      <input type="hidden" name="slug" value={venue.slug} />

      {/* BÁSICO */}
      <Section title="Básico">
        <Field label="Nombre" required>
          <input name="name" type="text" required defaultValue={venue.name} className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Slug (no editable)">
          <input
            readOnly
            disabled
            value={venue.slug}
            className={inputCls}
            style={{ ...inputStyle, color: "var(--fg-30)", background: "var(--card-2)" }}
          />
        </Field>
        <Field label="Descripción">
          <textarea name="description" rows={4} defaultValue={venue.description ?? ""} className={inputCls + " resize-none"} style={inputStyle} />
          <span className="mt-1 block text-xs" style={{ color: "var(--fg-30)" }}>Dejar vacío para limpiar.</span>
        </Field>
        <Field label="Categoría" required>
          <select name="categorySlug" required defaultValue={currentCategorySlug ?? ""} className={inputCls} style={inputStyle}>
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
          <input name="address" type="text" defaultValue={venue.address ?? ""} className={inputCls} style={inputStyle} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitud">
            <input name="lat" type="number" step="any" defaultValue={venue.location?.lat ?? ""} className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Longitud">
            <input name="lng" type="number" step="any" defaultValue={venue.location?.lng ?? ""} className={inputCls} style={inputStyle} />
          </Field>
        </div>
      </Section>

      {/* CONTACTO */}
      <Section title="Contacto">
        <Field label="Teléfono">
          <input name="phone" type="tel" defaultValue={venue.phone ?? ""} className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Sitio web">
          <input name="website" type="url" defaultValue={venue.website ?? ""} placeholder="https://…" className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Instagram">
          <input name="instagram" type="text" defaultValue={venue.instagram ?? ""} placeholder="@usuario" className={inputCls} style={inputStyle} />
        </Field>
      </Section>

      {/* IMAGEN */}
      <Section title="Imagen">
        <CoverImageField currentUrl={venue.coverImageUrl ?? null} />
      </Section>

      {/* TIPOS DE COMIDA */}
      {foodTypes.length > 0 && (
        <Section title="Tipos de comida">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {foodTypes.map((ft) => (
              <label key={ft.id} className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--fg-70)" }}>
                <input
                  type="checkbox"
                  name="foodTypeId"
                  value={ft.id}
                  defaultChecked={venue.foodTypeIds.includes(ft.id)}
                  className="h-4 w-4 rounded accent-[var(--terra)]"
                />
                {ft.name}
              </label>
            ))}
          </div>
        </Section>
      )}

      {/* HORARIOS */}
      <Section title="Horarios">
        <HoursField initialHours={initialHours} />
      </Section>

      {/* ESTADO */}
      <Section title="Estado">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Precio">
            <select name="priceRange" defaultValue={venue.priceRange ?? ""} className={inputCls} style={inputStyle}>
              <option value="">—</option>
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
            </select>
          </Field>
          <Field label="Estado">
            <select name="status" defaultValue={venue.status} className={inputCls} style={inputStyle}>
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

      <button
        type="submit"
        disabled={pending}
        className="rounded-[10px] px-5 py-2.5 text-sm font-medium transition active:opacity-80 disabled:opacity-50"
        style={{ background: "var(--terra)", color: "#fff" }}
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
    <div className="space-y-3">
      {displayed && (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[10px]" style={{ background: "var(--card-2)" }}>
          <Image src={displayed} alt="Portada actual" fill className="object-cover" unoptimized />
        </div>
      )}
      <input
        type="file"
        name="coverImage"
        accept="image/*"
        className="block w-full text-sm file:mr-3 file:rounded-[8px] file:border-0 file:px-3 file:py-1.5 file:text-sm file:font-medium"
        style={{ color: "var(--fg-50)" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setCleared(false);
            setPreview(URL.createObjectURL(file));
          }
        }}
      />
      {currentUrl && !cleared && (
        <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--fg-50)" }}>
          <input
            type="checkbox"
            name="clearCoverImage"
            value="1"
            className="h-4 w-4 rounded accent-[var(--rust)]"
            onChange={(e) => {
              setCleared(e.target.checked);
              if (e.target.checked) setPreview(null);
            }}
          />
          Eliminar imagen actual
        </label>
      )}
    </div>
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
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
