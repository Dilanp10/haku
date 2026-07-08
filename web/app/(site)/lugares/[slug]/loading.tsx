import { VenueDetailSkeleton } from "@/components/skeletons";

export default function VenueDetailLoading() {
  return (
    <main className="mx-auto max-w-2xl pb-bottom md:px-0">
      <VenueDetailSkeleton />
    </main>
  );
}
