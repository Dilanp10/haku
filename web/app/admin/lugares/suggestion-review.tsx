"use client";

import { useTransition } from "react";
import { Clock, Volume2, Check, X } from "lucide-react";
import {
  approveSuggestedHoursAction,
  dismissSuggestionMetaAction,
} from "./actions";

interface SuggestedHour {
  day: number;
  opens: string;
  closes: string;
}

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function SuggestionReview({
  venueId,
  slug,
  hours,
  audioUrl,
}: {
  venueId: string;
  slug: string;
  hours: SuggestedHour[];
  audioUrl: string | null;
}) {
  const [pending, start] = useTransition();

  if (hours.length === 0 && !audioUrl) return null;

  const byDay = (day: number) => hours.filter((h) => h.day === day);

  return (
    <div className="rounded-lg border-2 border-dashed border-amber-400/60 bg-amber-50/50 p-4 dark:bg-amber-950/20">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
        Sugerencia pendiente de revisar
      </p>

      {audioUrl && (
        <div className="mb-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
            <Volume2 className="h-4 w-4" /> Audio del usuario
          </p>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}

      {hours.length > 0 && (
        <div className="mb-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
            <Clock className="h-4 w-4" /> Horarios sugeridos
          </p>
          <ul className="space-y-1 text-sm">
            {DAY_ORDER.map((day) => {
              const entries = byDay(day);
              if (entries.length === 0) return null;
              return (
                <li key={day} className="flex gap-2">
                  <span className="w-10 font-medium text-muted-foreground">
                    {DAY_LABELS[day]}
                  </span>
                  <span>
                    {entries.map((e) => `${e.opens}–${e.closes}`).join(", ")}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {hours.length > 0 && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("venueId", venueId);
              fd.set("slug", slug);
              start(() => approveSuggestedHoursAction(fd));
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {pending ? "Aplicando…" : "Aprobar horarios"}
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set("venueId", venueId);
            fd.set("slug", slug);
            start(() => dismissSuggestionMetaAction(fd));
          }}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition hover:border-primary/40 disabled:opacity-50"
        >
          <X className="h-4 w-4" /> Descartar
        </button>
      </div>
    </div>
  );
}
