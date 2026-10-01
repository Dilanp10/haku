"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

const OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const;

export function ThemeToggleRow() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <li className="flex items-center justify-between py-4">
      <span className="text-brand text-base" style={{ color: "var(--fg)" }}>
        Tema
      </span>
      <div className="flex gap-1 rounded-pill p-1" style={{ background: "var(--card-2)" }}>
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          const active = theme === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setTheme(o.value)}
              className="flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs transition-colors"
              style={{
                background: active ? "var(--accent)" : "transparent",
                color: active ? "#fff" : "var(--fg-50)",
              }}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{o.label}</span>
            </button>
          );
        })}
      </div>
    </li>
  );
}
