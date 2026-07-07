import Link from "next/link";
import Image from "next/image";
import type { Venue, Category } from "@haku/core";
import { CardSaveButton } from "@/components/card-save-button";

interface Props {
  venue: Venue;
  category: Category | undefined;
  priority?: boolean;
  openNow?: boolean;
  closesAt?: string; // "HH:MM"
  closed?: boolean;
  distanceKm?: number;
}

export function VenueCard({
  venue,
  category,
  priority,
  openNow,
  closesAt,
  closed,
  distanceKm,
}: Props) {
  const meta = [category?.name, venue.address].filter(Boolean).join(" · ");

  return (
    <div className="group relative flex items-start gap-4 py-4 row-sep animate-fade-in-up">
      <Link
        href={`/lugares/${venue.slug}`}
        aria-label={venue.name}
        className="absolute inset-0 z-10 transition-opacity active:opacity-70"
      />

      <div
        className="relative shrink-0 size-16 rounded-[10px] overflow-hidden"
        style={{ background: "var(--card-2)" }}
      >
        {venue.coverImageUrl ? (
          <Image
            src={venue.coverImageUrl}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
            {...(priority ? { priority: true } : {})}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-xl text-brand"
            style={{ color: "var(--fg-30)" }}
          >
            {venue.name.charAt(0)}
          </div>
        )}
      </div>

      <div className="relative flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="text-brand text-[19px] leading-tight truncate"
            style={{ color: "var(--fg)" }}
          >
            {venue.name}
          </h3>
          <div className="flex flex-col items-end shrink-0 gap-0.5">
            {distanceKm !== undefined && (
              <span className="text-data" style={{ color: "var(--terra)" }}>
                {formatDistance(distanceKm)}
              </span>
            )}
            {venue.neighborhood && (
              <span className="text-data" style={{ color: "var(--fg-30)" }}>
                {venue.neighborhood}
              </span>
            )}
          </div>
        </div>
        {meta && (
          <p
            className="text-xs mt-0.5 truncate"
            style={{ color: "var(--fg-50)" }}
          >
            {meta}
          </p>
        )}

        {openNow ? (
          <p
            className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium"
            style={{ color: "var(--moss)" }}
          >
            <StatusDot color="var(--moss)" pulse />
            Abierto
            {closesAt && (
              <span className="text-data" style={{ color: "var(--moss)" }}>
                · cierra a las {closesAt}
              </span>
            )}
          </p>
        ) : closed ? (
          <p
            className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium"
            style={{ color: "var(--rust)" }}
          >
            <StatusDot color="var(--rust)" />
            Cerrado
          </p>
        ) : (
          venue.description && (
            <p
              className="text-[13px] mt-1 line-clamp-1"
              style={{ color: "var(--fg-70)" }}
            >
              {venue.description}
            </p>
          )
        )}
      </div>

      <div className="relative z-20 shrink-0 self-center">
        <CardSaveButton venueId={venue.id} slug={venue.slug} />
      </div>
    </div>
  );
}

function StatusDot({ color, pulse }: { color: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      {pulse && (
        <span
          className="absolute inset-0 rounded-full opacity-75 animate-ping"
          style={{ background: color }}
        />
      )}
      <span
        className="relative inline-flex h-2 w-2 rounded-full"
        style={{ background: color }}
      />
    </span>
  );
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
