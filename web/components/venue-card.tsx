import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import type { Venue, Category } from "@haku/core";

interface Props {
  venue: Venue;
  category: Category | undefined;
}

export function VenueCard({ venue, category }: Props) {
  return (
    <Link
      href={{ pathname: "/lugares/[slug]", query: { slug: venue.slug } } as const}
      className="group block overflow-hidden rounded-lg border bg-card transition hover:border-primary/40 hover:shadow-sm"
    >
      <div className="relative aspect-[16/10] w-full bg-muted overflow-hidden">
        {venue.coverImageUrl ? (
          <Image
            src={venue.coverImageUrl}
            alt={venue.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition group-hover:scale-[1.02]"
          />
        ) : null}
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-semibold">{venue.name}</h3>
          {venue.priceRange ? (
            <span className="shrink-0 text-xs text-muted-foreground">{venue.priceRange}</span>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {venue.description ?? "Sin descripción aún."}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {venue.address ?? "Catamarca"}
          </span>
          {category ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
              {category.name}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
