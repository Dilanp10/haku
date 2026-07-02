import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface SearchParams {
  lat?: string;
  lng?: string;
}

export default async function LugaresCercaLegacy({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.lat) qs.set("lat", sp.lat);
  if (sp.lng) qs.set("lng", sp.lng);
  const q = qs.toString();
  redirect(q ? `/lugares?${q}` : "/lugares");
}
