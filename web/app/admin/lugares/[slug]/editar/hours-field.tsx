"use client";

import { useState } from "react";

interface HourRow {
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  closed: boolean;
}

interface HoursFieldProps {
  initialHours: HourRow[];
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function toHHMM(t: string): string {
  return t.slice(0, 5);
}

export function HoursField({ initialHours }: HoursFieldProps) {
  const initial = Array.from({ length: 7 }, (_, i) => {
    const row = initialHours.find((h) => h.day_of_week === i);
    return {
      day_of_week: i,
      opens_at: row ? toHHMM(row.opens_at) : "",
      closes_at: row ? toHHMM(row.closes_at) : "",
      closed: row?.closed ?? false,
    };
  });

  const [rows, setRows] = useState(initial);

  function toggle(i: number, field: "closed") {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: !r[field] } : r)),
    );
  }

  function setTime(i: number, field: "opens_at" | "closes_at", value: string) {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)),
    );
  }

  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">Horarios de atención</legend>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[110px_1fr_1fr_auto] items-center gap-3">
            <span className="text-sm font-medium">{DAY_NAMES[i]}</span>

            <input
              type="time"
              name={`hours[${i}][opens_at]`}
              value={row.opens_at}
              onChange={(e) => setTime(i, "opens_at", e.target.value)}
              disabled={row.closed}
              className="h-8 rounded border bg-background px-2 text-sm disabled:opacity-40"
              aria-label={`${DAY_NAMES[i]} apertura`}
            />

            <input
              type="time"
              name={`hours[${i}][closes_at]`}
              value={row.closes_at}
              onChange={(e) => setTime(i, "closes_at", e.target.value)}
              disabled={row.closed}
              className="h-8 rounded border bg-background px-2 text-sm disabled:opacity-40"
              aria-label={`${DAY_NAMES[i]} cierre`}
            />

            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                name={`hours[${i}][closed]`}
                checked={row.closed}
                onChange={() => toggle(i, "closed")}
                className="h-3.5 w-3.5"
              />
              Cerrado
            </label>

            {/* campos ocultos para que el parser sepa qué día es cada fila */}
            <input type="hidden" name={`hours[${i}][day]`} value={i} />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
