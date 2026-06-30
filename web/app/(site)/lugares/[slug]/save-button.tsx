"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "./actions";

interface SaveButtonProps {
  venueId: string;
  slug: string;
}

export function SaveButton({ venueId, slug }: SaveButtonProps) {
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
            : "No pudimos guardar tu favorito. Intentá de nuevo.",
        );
      } else {
        setSaved(result.saved);
      }
    });
  }

  const isLoading = saved === null;
  const label = saved ? "Quitar de favoritos" : "Guardar favorito";

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        onClick={handleToggle}
        disabled={isLoading || isPending}
        aria-label={label}
        className={`rounded-full p-1.5 transition-colors ${
          isLoading || isPending
            ? "cursor-default text-muted-foreground/40"
            : saved
            ? "text-red-500 hover:text-red-600"
            : "text-muted-foreground hover:text-red-400"
        }`}
      >
        <Heart
          className="h-5 w-5"
          fill={saved ? "currentColor" : "none"}
          strokeWidth={2}
        />
      </button>
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </span>
  );
}
