"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  value?: string | undefined;
  placeholder?: string | undefined;
  action: string;
  /** Parámetros extra que se preservan en el submit (ej. categoria=bar). */
  preserveParams?: Record<string, string> | undefined;
}

/**
 * Barra de búsqueda progresivamente mejorada.
 * Usa <form method="GET"> → funciona sin JS; con JS hace push del router
 * para preservar params existentes en la URL.
 */
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
      <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
      <input
        ref={inputRef}
        name="q"
        type="search"
        defaultValue={value}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border bg-background pl-9 pr-8 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Buscar lugares"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </form>
  );
}
