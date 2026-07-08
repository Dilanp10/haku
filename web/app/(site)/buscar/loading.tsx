import { ListHeaderSkeleton, VenueCardSkeleton } from "@/components/skeletons";

export default function BuscarLoading() {
  return (
    <main className="mx-auto max-w-2xl md:max-w-5xl px-4 sm:px-6 pb-bottom">
      <ListHeaderSkeleton />
      <div className="pt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <VenueCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
