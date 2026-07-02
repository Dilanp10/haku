import { Star } from "lucide-react";

interface RatingDisplayProps {
  averageRating: number | null;
  ratingCount: number;
}

export function RatingDisplay({ averageRating, ratingCount }: RatingDisplayProps) {
  if (averageRating === null || ratingCount === 0) {
    return (
      <span className="text-xs" style={{ color: "var(--fg-30)" }}>
        Sin puntuaciones aún
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--fg-50)" }}>
      <Star className="h-3.5 w-3.5" style={{ color: "var(--ochre)" }} fill="currentColor" />
      <span className="font-medium" style={{ color: "var(--fg)" }}>{averageRating}</span>
      <span>({ratingCount} {ratingCount === 1 ? "voto" : "votos"})</span>
    </span>
  );
}
