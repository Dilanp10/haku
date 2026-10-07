"use client";

import { useEffect, useState, useTransition } from "react";
import { Star } from "lucide-react";
import { rateVenueAction } from "./actions";

interface RatingPickerProps {
  venueId: string;
  slug: string;
  hasSession: boolean;
}

export function RatingPicker({ venueId, slug, hasSession }: RatingPickerProps) {
  const [myRating, setMyRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!hasSession) {
      setLoaded(true);
      return;
    }
    fetch(`/api/venues/${slug}/my-rating`)
      .then((r) => r.json())
      .then((data: { rating: number | null }) => {
        setMyRating(data.rating);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [slug, hasSession]);

  function handleRate(star: number) {
    if (!hasSession || isPending || !loaded) return;
    setError(null);
    const prev = myRating;
    setMyRating(star);
    startTransition(async () => {
      const result = await rateVenueAction(venueId, star, slug);
      if (!result.ok) {
        setMyRating(prev);
        setError(
          result.error === "UNAUTHENTICATED"
            ? "Iniciá sesión para puntuar"
            : "No pudimos guardar tu puntuación.",
        );
      } else {
        setMyRating(result.rating);
      }
    });
  }

  const activeRating = hovered ?? myRating ?? 0;

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span
        className="inline-flex items-center gap-0.5"
        aria-label={hasSession ? "Puntuá este lugar" : "Iniciá sesión para puntuar"}
        title={!hasSession ? "Iniciá sesión para puntuar" : undefined}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!hasSession || isPending || !loaded}
            onClick={() => handleRate(star)}
            onMouseEnter={() => hasSession && setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            aria-label={`${star} estrella${star !== 1 ? "s" : ""}`}
            className="flex size-11 items-center justify-center transition-colors"
            style={{
              color:
                !hasSession || !loaded
                  ? "var(--fg-30)"
                  : isPending
                  ? "var(--fg-30)"
                  : star <= activeRating
                  ? "var(--accent)"
                  : "var(--fg-30)",
              cursor: !hasSession || !loaded || isPending ? "default" : "pointer",
            }}
          >
            <Star
              className="h-5 w-5"
              fill={star <= activeRating ? "currentColor" : "none"}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </span>
      {error && (
        <span className="text-xs" style={{ color: "var(--danger)" }}>{error}</span>
      )}
    </span>
  );
}
