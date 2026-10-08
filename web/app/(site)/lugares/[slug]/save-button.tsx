"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "./actions";

interface SaveButtonProps {
  venueId: string;
  slug: string;
  /** "overlay": para usar superpuesto sobre foto (héroe); corazón blanco. */
  variant?: "default" | "overlay";
}

export function SaveButton({ venueId, slug, variant = "default" }: SaveButtonProps) {
  const [saved, setSaved] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch(`/api/venues/${slug}/saved`)
      .then((r) => r.json())
      .then((data: { saved: boolean }) => setSaved(data.saved))
      .catch(() => setSaved(false));
  }, [slug]);

  function handleToggle() {
    if (saved === null || isPending) return;
    setError(null);
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const result = await toggleFavoriteAction(venueId);
      if (!result.ok) {
        setSaved(!next);
        setError(
          result.error === "UNAUTHENTICATED"
            ? "Iniciá sesión para guardar"
            : "No pudimos guardar tu favorito.",
        );
      } else {
        setSaved(result.saved);
      }
    });
  }

  const isLoading = saved === null;

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        onClick={handleToggle}
        disabled={isLoading || isPending}
        aria-label={saved ? "Quitar de favoritos" : "Guardar favorito"}
        className="rounded-full p-1.5 transition-opacity active:opacity-70"
        style={{
          color:
            saved && !isLoading && !isPending
              ? "var(--rust)"
              : variant === "overlay"
                ? "rgba(255,255,255,0.9)"
                : "var(--fg-30)",
          cursor: isLoading || isPending ? "default" : "pointer",
        }}
      >
        <Heart
          className="h-5 w-5"
          fill={saved ? "currentColor" : "none"}
          strokeWidth={2}
        />
      </button>
      {error && (
        <span className="text-xs" style={{ color: "var(--rust)" }}>{error}</span>
      )}
    </span>
  );
}
