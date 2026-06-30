import { Star } from "lucide-react";

interface RatingDisplayProps {
  averageRating: number | null;
  ratingCount: number;
}

export function RatingDisplay({ averageRating, ratingCount }: RatingDisplayProps) {
  if (averageRating === null || ratingCount === 0) {
    return (
      <span className="text-xs text-muted-foreground">Sin puntuaciones aún</span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="font-medium text-foreground">{averageRating}</span>
      <span>({ratingCount} {ratingCount === 1 ? "voto" : "votos"})</span>
    </span>
  );
}
