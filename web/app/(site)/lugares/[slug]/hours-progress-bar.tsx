"use client";

import { useEffect, useState } from "react";

interface HoursProgressBarProps {
  opensAt: string;
  closesAt: string;
}

function toMinutes(t: string): number {
  const parts = t.split(":");
  return Number(parts[0] ?? 0) * 60 + Number(parts[1] ?? 0);
}

function catamarcaNow(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Catamarca" }),
  );
}

export function HoursProgressBar({ opensAt, closesAt }: HoursProgressBarProps) {
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    function calc() {
      const now = catamarcaNow();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const open = toMinutes(opensAt);
      const close = toMinutes(closesAt);
      const total = close - open;
      if (total <= 0) return null;
      const elapsed = nowMin - open;
      if (elapsed < 0) return 0;
      if (elapsed >= total) return 100;
      return Math.round((elapsed / total) * 100);
    }
    setProgress(calc());
    const id = setInterval(() => setProgress(calc()), 60_000);
    return () => clearInterval(id);
  }, [opensAt, closesAt]);

  if (progress === null) return null;

  const isClosingSoon = progress >= 75;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs" style={{ color: "var(--fg-50)" }}>
        {opensAt.slice(0, 5)}
      </span>
      <div
        className="relative h-1.5 flex-1 overflow-hidden rounded-full"
        style={{ background: "var(--line-2)" }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: isClosingSoon ? "var(--danger)" : "var(--success)",
          }}
        />
      </div>
      <span className="text-xs" style={{ color: "var(--fg-50)" }}>
        {closesAt.slice(0, 5)}
      </span>
    </div>
  );
}
