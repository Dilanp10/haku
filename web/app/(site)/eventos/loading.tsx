import { EventCardSkeleton, ListHeaderSkeleton } from "@/components/skeletons";

export default function EventosLoading() {
  return (
    <main className="mx-auto max-w-2xl md:max-w-5xl px-4 sm:px-6 pb-bottom">
      <ListHeaderSkeleton />
      <div className="pt-2 md:grid md:grid-cols-2 md:gap-x-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
