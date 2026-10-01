"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "@/app/(site)/lugares/[slug]/actions";

interface Props {
  venueId: string;
  slug: string;
}

export function CardSaveButton({ venueId, slug }: Props) {
  const [saved, setSaved] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch(`/api/venues/${slug}/saved`)
      .then((r) => r.json())
      .then((data: { saved: boolean }) => setSaved(data.saved))
      .catch(() => setSaved(false));
  }, [slug]);

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (saved === null || isPending) return;
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const result = await toggleFavoriteAction(venueId);
      if (!result.ok) {
        setSaved(!next);
      } else {
        setSaved(result.saved);
      }
    });
  }

  const loading = saved === null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading || isPending}
      aria-label={saved ? "Quitar de favoritos" : "Guardar favorito"}
      className="rounded-full p-2 transition active:scale-90"
      style={{
        color: saved ? "var(--accent)" : "var(--fg-30)",
      }}
    >
      <Heart
        className="h-5 w-5"
        fill={saved ? "currentColor" : "none"}
        strokeWidth={2}
      />
    </button>
  );
}
