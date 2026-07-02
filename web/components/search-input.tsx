"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  value?: string | undefined;
  placeholder?: string | undefined;
  action: string;
  preserveParams?: Record<string, string> | undefined;
}

export function SearchInput({ value = "", placeholder = "Buscar…", action, preserveParams = {} }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim() ?? "";
    const qs = new URLSearchParams(preserveParams);
    if (q) qs.set("q", q);
    router.push(`${action}?${qs.toString()}`);
  };

  const handleClear = () => {
    const qs = new URLSearchParams(preserveParams);
    router.push(`${action}?${qs.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} role="search" className="relative flex items-center">
      <Search
        className="pointer-events-none absolute left-3 h-4 w-4"
        style={{ color: "var(--fg-30)" }}
      />
      <input
        ref={inputRef}
        name="q"
        type="search"
        defaultValue={value}
        placeholder={placeholder}
        className="h-10 w-full rounded-[10px] border pl-9 pr-8 text-sm transition focus:outline-none focus:ring-2"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--line-2)",
          color: "var(--fg)",
        }}
        aria-label="Buscar"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 rounded p-0.5 transition-opacity hover:opacity-70"
          style={{ color: "var(--fg-50)" }}
          aria-label="Limpiar búsqueda"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </form>
  );
}
