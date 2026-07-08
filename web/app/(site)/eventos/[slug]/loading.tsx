import { VenueDetailSkeleton } from "@/components/skeletons";

export default function EventDetailLoading() {
  return (
    <main className="mx-auto max-w-2xl pb-bottom md:px-0">
      <VenueDetailSkeleton />
    </main>
  );
}
