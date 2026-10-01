"use client";

import { useState, useRef, useActionState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Store,
  Tag,
  MapPin,
  FileText,
  Camera,
  Clock,
  CheckCircle2,
  Loader2,
  Mic,
  Square,
  Play,
  Trash2,
  Locate,
  X,
} from "lucide-react";
import { suggestVenueAction, type SuggestState } from "./actions";
import type { Category } from "@haku/core";

const TOTAL_STEPS = 7;

const initial: SuggestState = { status: "idle" };

type HourEntry = { day: number; opens: string; closes: string };

export function SuggestForm({ categories }: { categories: Category[] }) {
  const [step, setStep] = useState(1);
  const [state, action, pending] = useActionState(suggestVenueAction, initial);

  const [name, setName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [description, setDescription] = useState("");
  const [audio, setAudio] = useState<{ blob: Blob; url: string } | null>(null);
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [hours, setHours] = useState<HourEntry[]>([]);

  const formRef = useRef<HTMLFormElement | null>(null);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-5 py-12 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "var(--success)", color: "#fff" }}
        >
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-brand text-2xl" style={{ color: "var(--fg)" }}>
          ¡Gracias!
        </h2>
        <p className="max-w-sm text-sm" style={{ color: "var(--fg-50)" }}>
          <span className="font-semibold" style={{ color: "var(--fg)" }}>
            {state.name}
          </span>{" "}
          fue recibido y está siendo revisado. Lo publicaremos pronto.
        </p>
      </div>
    );
  }

  const canNext =
    (step === 1 && name.trim().length >= 2) ||
    (step === 2) || // categoría opcional
    (step === 3 && (coords !== null || address.trim().length >= 3)) ||
    step === 4 ||
    step === 5 ||
    step === 6 ||
    step === 7;

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));
  const selectedCategory = categories.find((c) => c.slug === categorySlug);

  function submitAll() {
    if (!formRef.current) return;
    formRef.current.requestSubmit();
  }

  return (
    <div className="relative">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-data" style={{ color: "var(--fg-50)" }}>
            Paso {step} de {TOTAL_STEPS}
          </span>
          <span className="text-data" style={{ color: "var(--accent)" }}>
            {Math.round((step / TOTAL_STEPS) * 100)}%
          </span>
        </div>
        <div
          className="h-1 w-full rounded-full overflow-hidden"
          style={{ background: "var(--line)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%`, background: "var(--accent)" }}
          />
        </div>
      </div>

      <div className="min-h-[280px] flex flex-col">
        {step === 1 && (
          <StepShell
            icon={<Store className="h-6 w-6" />}
            title="¿Cómo se llama el lugar?"
            subtitle="El nombre tal como aparece en el local."
            required
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Café del Valle"
              maxLength={120}
              autoFocus
              className="w-full rounded-[10px] border px-4 py-3 text-base outline-none"
              style={{
                borderColor: "var(--line-2)",
                background: "var(--card-bg)",
                color: "var(--fg)",
              }}
              onKeyDown={(e) => e.key === "Enter" && canNext && next()}
            />
          </StepShell>
        )}

        {step === 2 && (
          <StepShell
            icon={<Tag className="h-6 w-6" />}
            title="¿Qué tipo de lugar es?"
            subtitle="Elegí la que mejor lo describe. Podés saltar este paso."
          >
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setCategorySlug(categorySlug === c.slug ? "" : c.slug)
                  }
                  className="rounded-[10px] border px-4 py-3 text-left text-sm font-medium transition active:scale-[0.97]"
                  style={{
                    borderColor:
                      categorySlug === c.slug ? "var(--accent)" : "var(--line-2)",
                    background:
                      categorySlug === c.slug ? "var(--accent)" : "var(--card-bg)",
                    color: categorySlug === c.slug ? "#fff" : "var(--fg)",
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell
            icon={<MapPin className="h-6 w-6" />}
            title="¿Dónde queda?"
            subtitle="Compartí tu ubicación o escribí la dirección."
            required
          >
            <LocationInput
              address={address}
              onAddressChange={setAddress}
              coords={coords}
              onCoords={setCoords}
            />
          </StepShell>
        )}

        {step === 4 && (
          <StepShell
            icon={<FileText className="h-6 w-6" />}
            title="Contanos cómo es"
            subtitle="Escribí o grabá un audio. Todo opcional."
          >
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Cómo es el lugar? ¿Qué destacarías?"
              maxLength={2000}
              rows={4}
              className="w-full resize-none rounded-[10px] border px-4 py-3 text-base outline-none"
              style={{
                borderColor: "var(--line-2)",
                background: "var(--card-bg)",
                color: "var(--fg)",
              }}
            />
            <div className="mt-3">
              <AudioRecorder audio={audio} onChange={setAudio} />
            </div>
          </StepShell>
        )}

        {step === 5 && (
          <StepShell
            icon={<Camera className="h-6 w-6" />}
            title="Foto del lugar"
            subtitle="Si tenés una, ayuda a mostrarlo mejor. Opcional."
          >
            <PhotoPicker photo={photo} onChange={setPhoto} />
          </StepShell>
        )}

        {step === 6 && (
          <StepShell
            icon={<Clock className="h-6 w-6" />}
            title="¿Qué horarios tiene?"
            subtitle="Elegí los días y horas de apertura. Opcional."
          >
            <HoursPicker hours={hours} onChange={setHours} />
          </StepShell>
        )}

        {step === 7 && (
          <StepShell
            icon={<CheckCircle2 className="h-6 w-6" />}
            title="Revisá tu sugerencia"
            subtitle="Confirmá que todo esté bien antes de enviar."
          >
            <div
              className="rounded-[10px] border divide-y"
              style={{ borderColor: "var(--line)", background: "var(--card-bg)" }}
            >
              <SummaryRow label="Nombre" value={name} />
              <SummaryRow
                label="Categoría"
                value={selectedCategory?.name ?? "—"}
              />
              <SummaryRow
                label="Ubicación"
                value={
                  coords
                    ? `📍 Ubicación GPS${address ? ` · ${address}` : ""}`
                    : address || "—"
                }
              />
              <SummaryRow
                label="Descripción"
                value={
                  description
                    ? description
                    : audio
                      ? "🎙 (audio grabado)"
                      : "—"
                }
              />
              <SummaryRow label="Foto" value={photo ? "✔ adjunta" : "—"} />
              <SummaryRow
                label="Horarios"
                value={hours.length ? `${hours.length} horario${hours.length > 1 ? "s" : ""}` : "—"}
              />
            </div>

            {state.status === "error" && (
              <p
                className="mt-3 rounded-[10px] border px-4 py-2 text-sm"
                style={{
                  borderColor: "var(--danger)",
                  color: "var(--danger)",
                  background: "var(--card-bg)",
                }}
              >
                {state.message}
              </p>
            )}
          </StepShell>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={back}
            className="flex items-center gap-1 rounded-[10px] border px-4 py-2.5 text-sm font-medium transition active:opacity-80"
            style={{ borderColor: "var(--line-2)", color: "var(--fg-70)" }}
          >
            <ChevronLeft className="h-4 w-4" /> Atrás
          </button>
        )}

        <div className="flex-1" />

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={next}
            disabled={!canNext}
            className="flex items-center gap-1 rounded-[10px] px-5 py-2.5 text-sm font-medium transition active:opacity-80 disabled:opacity-40"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Siguiente <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <>
            <form
              ref={formRef}
              action={action}
              encType="multipart/form-data"
              className="contents"
            >
              <input type="hidden" name="name" value={name} />
              <input type="hidden" name="categorySlug" value={categorySlug} />
              <input type="hidden" name="address" value={address} />
              {coords && (
                <>
                  <input type="hidden" name="lat" value={String(coords.lat)} />
                  <input type="hidden" name="lng" value={String(coords.lng)} />
                </>
              )}
              <input type="hidden" name="description" value={description} />
              <input type="hidden" name="hours" value={JSON.stringify(hours)} />
              {photo && <FileHiddenInput name="photo" file={photo.file} />}
              {audio && (
                <FileHiddenInput
                  name="audio"
                  file={new File([audio.blob], "audio.webm", { type: audio.blob.type })}
                />
              )}
            </form>
            <button
              type="button"
              onClick={submitAll}
              disabled={pending}
              className="flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-medium transition active:opacity-80 disabled:opacity-60"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                </>
              ) : (
                "Enviar sugerencia"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* FileHiddenInput: usa DataTransfer para meter File en el submit real */
function FileHiddenInput({ name, file }: { name: string; file: File }) {
  const ref = useRef<HTMLInputElement | null>(null);
  const setRef = (el: HTMLInputElement | null) => {
    ref.current = el;
    if (el && typeof DataTransfer !== "undefined") {
      const dt = new DataTransfer();
      dt.items.add(file);
      el.files = dt.files;
    }
  };
  return <input ref={setRef} type="file" name={name} className="hidden" />;
}

function StepShell({
  icon,
  title,
  subtitle,
  required,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-6">
        <div
          className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {icon}
        </div>
        <h2 className="text-brand text-xl" style={{ color: "var(--fg)" }}>
          {title}
          {required && (
            <span className="ml-2 text-xs font-normal" style={{ color: "var(--accent)" }}>
              obligatorio
            </span>
          )}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-50)" }}>
          {subtitle}
        </p>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span
        className="shrink-0 text-xs font-medium uppercase tracking-wider"
        style={{ color: "var(--fg-50)", minWidth: 90 }}
      >
        {label}
      </span>
      <span
        className="text-sm break-words"
        style={{ color: value === "—" ? "var(--fg-30)" : "var(--fg)" }}
      >
        {value}
      </span>
    </div>
  );
}

/* -------- Location -------- */
function LocationInput({
  address,
  onAddressChange,
  coords,
  onCoords,
}: {
  address: string;
  onAddressChange: (v: string) => void;
  coords: { lat: number; lng: number } | null;
  onCoords: (v: { lat: number; lng: number } | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const activate = () => {
    setErr(null);
    if (!("geolocation" in navigator)) {
      setErr("Tu navegador no soporta geolocalización.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        onCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setBusy(false);
      },
      (e) => {
        setBusy(false);
        setErr(
          e.code === e.PERMISSION_DENIED
            ? "Permitilo desde las opciones del navegador."
            : "No pudimos obtener tu ubicación.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-3">
      {coords ? (
        <div
          className="flex items-center gap-3 rounded-[10px] border p-3"
          style={{ borderColor: "var(--success)", background: "var(--card-bg)" }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--success)", color: "#fff" }}
          >
            <MapPin className="h-4 w-4" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-medium" style={{ color: "var(--fg)" }}>
              Ubicación capturada
            </p>
            <p className="text-xs" style={{ color: "var(--fg-50)" }}>
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onCoords(null)}
            className="rounded-full p-1.5"
            style={{ color: "var(--fg-50)" }}
            aria-label="Quitar ubicación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={activate}
          disabled={busy}
          className="flex w-full items-center gap-3 rounded-[10px] border px-4 py-3 text-sm font-medium transition active:opacity-80 disabled:opacity-60"
          style={{
            borderColor: "var(--accent)",
            background: "var(--accent-wash)",
            color: "var(--accent)",
          }}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Locate className="h-4 w-4" />
          )}
          {busy ? "Obteniendo ubicación…" : "Usar mi ubicación actual"}
        </button>
      )}

      {err && (
        <p className="text-xs" style={{ color: "var(--danger)" }}>
          {err}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--fg-30)" }}>
        <span className="flex-1 h-px" style={{ background: "var(--line)" }} />
        <span>o escribí la dirección</span>
        <span className="flex-1 h-px" style={{ background: "var(--line)" }} />
      </div>

      <input
        type="text"
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        placeholder="Ej. San Martín 100, Catamarca"
        maxLength={240}
        className="w-full rounded-[10px] border px-4 py-3 text-base outline-none"
        style={{
          borderColor: "var(--line-2)",
          background: "var(--card-bg)",
          color: "var(--fg)",
        }}
      />
    </div>
  );
}

/* -------- Audio recorder -------- */
function AudioRecorder({
  audio,
  onChange,
}: {
  audio: { blob: Blob; url: string } | null;
  onChange: (v: { blob: Blob; url: string } | null) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onChange({ blob, url: URL.createObjectURL(blob) });
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      setRecording(true);
    } catch {
      setErr("No pudimos acceder al micrófono.");
    }
  };

  const stop = () => {
    recRef.current?.stop();
    setRecording(false);
  };

  const remove = () => {
    if (audio?.url) URL.revokeObjectURL(audio.url);
    onChange(null);
  };

  if (audio) {
    return (
      <div
        className="flex items-center gap-3 rounded-[10px] border p-3"
        style={{ borderColor: "var(--accent)", background: "var(--card-bg)" }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Play className="h-4 w-4" />
        </div>
        <audio controls src={audio.url} className="flex-1" />
        <button
          type="button"
          onClick={remove}
          className="rounded-full p-1.5"
          style={{ color: "var(--danger)" }}
          aria-label="Eliminar audio"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={recording ? stop : start}
        className="flex w-full items-center gap-3 rounded-[10px] border px-4 py-3 text-sm font-medium transition active:opacity-80"
        style={{
          borderColor: recording ? "var(--danger)" : "var(--line-2)",
          background: recording ? "var(--danger)" : "var(--card-bg)",
          color: recording ? "#fff" : "var(--fg-70)",
        }}
      >
        {recording ? (
          <>
            <Square className="h-4 w-4" fill="currentColor" />
            <span className="flex-1 text-left">Detener grabación</span>
            <span className="relative inline-flex h-2 w-2">
              <span
                className="absolute inset-0 rounded-full opacity-75 animate-ping"
                style={{ background: "#fff" }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: "#fff" }}
              />
            </span>
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <span>Grabar un audio</span>
          </>
        )}
      </button>
      {err && (
        <p className="mt-2 text-xs" style={{ color: "var(--danger)" }}>
          {err}
        </p>
      )}
    </div>
  );
}

/* -------- Photo picker -------- */
function PhotoPicker({
  photo,
  onChange,
}: {
  photo: { file: File; url: string } | null;
  onChange: (v: { file: File; url: string } | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    onChange({ file: f, url: URL.createObjectURL(f) });
  };

  const remove = () => {
    if (photo?.url) URL.revokeObjectURL(photo.url);
    onChange(null);
  };

  if (photo) {
    return (
      <div
        className="relative overflow-hidden rounded-[12px] border"
        style={{ borderColor: "var(--line-2)" }}
      >
        <div className="relative aspect-[16/10] w-full">
          <img
            src={photo.url}
            alt="Preview"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <button
          type="button"
          onClick={remove}
          className="absolute right-2 top-2 rounded-full p-1.5 shadow"
          style={{ background: "var(--bg)", color: "var(--danger)" }}
          aria-label="Quitar foto"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed py-10 text-sm transition active:opacity-80"
        style={{
          borderColor: "var(--line-2)",
          background: "var(--card-bg)",
          color: "var(--fg-50)",
        }}
      >
        <Camera className="h-6 w-6" style={{ color: "var(--accent)" }} />
        <span>Elegir foto</span>
        <span className="text-xs" style={{ color: "var(--fg-30)" }}>
          jpg, png o webp · máx 5MB
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </>
  );
}

/* -------- Hours picker -------- */
// Orden visual Lun→Dom (Domingo=0 en JS)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS_SHORT: Record<number, string> = {
  0: "Dom",
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
};

function HoursPicker({
  hours,
  onChange,
}: {
  hours: HourEntry[];
  onChange: (v: HourEntry[]) => void;
}) {
  const dayEntries = (day: number) => hours.filter((h) => h.day === day);

  const addRange = (day: number) => {
    const existing = dayEntries(day);
    // Segunda banda por defecto: turno tarde
    const defaults =
      existing.length === 0
        ? { opens: "09:00", closes: "13:00" }
        : { opens: "17:00", closes: "23:00" };
    onChange([...hours, { day, ...defaults }]);
  };

  const updateRange = (index: number, patch: Partial<HourEntry>) => {
    onChange(hours.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  };

  const removeRange = (index: number) => {
    onChange(hours.filter((_, i) => i !== index));
  };

  const clearDay = (day: number) => {
    onChange(hours.filter((h) => h.day !== day));
  };

  const applyToWeekdays = () => {
    const monRanges = dayEntries(1).map(({ opens, closes }) => ({ opens, closes }));
    if (monRanges.length === 0) return;
    const others = hours.filter((h) => ![1, 2, 3, 4, 5].includes(h.day));
    const weekdays = [1, 2, 3, 4, 5].flatMap((day) =>
      monRanges.map((r) => ({ day, ...r })),
    );
    onChange([...others, ...weekdays]);
  };

  const applyToAllDays = () => {
    const monRanges = dayEntries(1).map(({ opens, closes }) => ({ opens, closes }));
    if (monRanges.length === 0) return;
    const all = [0, 1, 2, 3, 4, 5, 6].flatMap((day) =>
      monRanges.map((r) => ({ day, ...r })),
    );
    onChange(all);
  };

  const canReplicate = dayEntries(1).length > 0;

  return (
    <div className="space-y-3">
      {canReplicate && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyToWeekdays}
            className="rounded-full border px-3 py-1 text-xs font-medium transition active:opacity-80"
            style={{
              borderColor: "var(--accent)",
              color: "var(--accent)",
              background: "var(--accent-wash)",
            }}
          >
            Copiar Lun a Mar–Vie
          </button>
          <button
            type="button"
            onClick={applyToAllDays}
            className="rounded-full border px-3 py-1 text-xs font-medium transition active:opacity-80"
            style={{
              borderColor: "var(--accent)",
              color: "var(--accent)",
              background: "var(--accent-wash)",
            }}
          >
            Copiar Lun a todos los días
          </button>
        </div>
      )}

      <div className="space-y-2">
        {DAY_ORDER.map((day) => {
          const entries = hours
            .map((h, i) => ({ ...h, index: i }))
            .filter((h) => h.day === day);
          const label = DAY_LABELS_SHORT[day];
          return (
            <div
              key={day}
              className="rounded-[12px] border p-3"
              style={{ borderColor: "var(--line-2)", background: "var(--card-bg)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-brand text-[15px] font-medium"
                  style={{
                    color: entries.length > 0 ? "var(--fg)" : "var(--fg-50)",
                    minWidth: 42,
                  }}
                >
                  {label}
                </span>

                <div className="flex-1 flex items-center gap-1.5 flex-wrap justify-end">
                  {entries.length === 0 && (
                    <span className="text-xs" style={{ color: "var(--fg-30)" }}>
                      Cerrado
                    </span>
                  )}

                  {entries.map((entry) => (
                    <div
                      key={entry.index}
                      className="flex items-center gap-1 rounded-full border pl-2 pr-1 py-0.5"
                      style={{
                        borderColor: "var(--success)",
                        background: "var(--bg)",
                      }}
                    >
                      <input
                        type="time"
                        value={entry.opens}
                        onChange={(e) =>
                          updateRange(entry.index, { opens: e.target.value })
                        }
                        className="w-[64px] bg-transparent text-xs outline-none"
                        style={{ color: "var(--fg)" }}
                      />
                      <span style={{ color: "var(--fg-30)" }}>–</span>
                      <input
                        type="time"
                        value={entry.closes}
                        onChange={(e) =>
                          updateRange(entry.index, { closes: e.target.value })
                        }
                        className="w-[64px] bg-transparent text-xs outline-none"
                        style={{ color: "var(--fg)" }}
                      />
                      <button
                        type="button"
                        onClick={() => removeRange(entry.index)}
                        className="rounded-full p-0.5 transition active:opacity-70"
                        style={{ color: "var(--fg-50)" }}
                        aria-label="Quitar rango"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addRange(day)}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition active:opacity-80"
                    style={{
                      background: "var(--accent)",
                      color: "#fff",
                    }}
                    aria-label={`Agregar horario a ${label}`}
                  >
                    + horario
                  </button>

                  {entries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => clearDay(day)}
                      className="text-xs transition-opacity hover:opacity-70"
                      style={{ color: "var(--fg-30)" }}
                    >
                      cerrar día
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs" style={{ color: "var(--fg-30)" }}>
        Podés agregar varios rangos por día (ej. 09:00–13:00 y 17:00–23:00).
      </p>
    </div>
  );
}
