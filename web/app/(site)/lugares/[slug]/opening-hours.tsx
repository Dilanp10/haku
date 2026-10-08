"use client";

import { useEffect, useState } from "react";

interface HourRow {
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  closed: boolean;
}

interface OpeningHoursProps {
  hours: HourRow[];
}

const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_LONG = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function toMinutes(t: string): number {
  const parts = t.split(":");
  return Number(parts[0] ?? 0) * 60 + Number(parts[1] ?? 0);
}

function fmt(t: string): string {
  return t.slice(0, 5);
}

type OpenStatus =
  | { open: true; closesAt: string }
  | { open: false; nextDay: number | null; nextTime: string | null };

function calcStatus(hours: HourRow[], now: Date): OpenStatus {
  const today = now.getDay();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const todayRow = hours.find((h) => h.day_of_week === today);
  if (todayRow && !todayRow.closed) {
    const opens = toMinutes(todayRow.opens_at);
    const closes = toMinutes(todayRow.closes_at);
    if (nowMins >= opens && nowMins < closes) {
      return { open: true, closesAt: fmt(todayRow.closes_at) };
    }
  }

  for (let d = 1; d <= 7; d++) {
    const nextDay = (today + d) % 7;
    const row = hours.find((h) => h.day_of_week === nextDay && !h.closed);
    if (row) {
      return { open: false, nextDay, nextTime: fmt(row.opens_at) };
    }
  }

  return { open: false, nextDay: null, nextTime: null };
}

export function OpeningHours({ hours }: OpeningHoursProps) {
  const [status, setStatus] = useState<OpenStatus | null>(null);

  useEffect(() => {
    setStatus(calcStatus(hours, new Date()));
  }, [hours]);

  if (hours.length === 0) return null;

  return (
    <div className="space-y-3">
      {status && (
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          style={
            status.open
              ? { background: "rgba(138,162,101,0.15)", color: "var(--moss)" }
              : { background: "rgba(192,102,78,0.15)", color: "var(--rust)" }
          }
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: status.open ? "var(--moss)" : "var(--rust)" }}
          />
          {status.open
            ? `Abierto · Cierra a las ${status.closesAt}`
            : status.nextDay !== null
            ? `Cerrado · Abre el ${DAY_LONG[status.nextDay]} a las ${status.nextTime}`
            : "Cerrado"}
        </div>
      )}

      <table className="w-full text-sm">
        <tbody>
          {hours.map((row) => (
            <tr key={row.day_of_week} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
              <td className="py-1 pr-4 text-data" style={{ color: "var(--fg)" }}>
                {DAY_SHORT[row.day_of_week]}
              </td>
              <td className="py-1" style={{ color: "var(--fg-50)" }}>
                {row.closed ? "Cerrado" : `${fmt(row.opens_at)} – ${fmt(row.closes_at)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
