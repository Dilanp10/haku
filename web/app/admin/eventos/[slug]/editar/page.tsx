import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseEventRepository } from "@haku/events";
import { requireProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { EditEventForm } from "./edit-event-form";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditarEventoPage({ params }: Props) {
  await requireProfile("admin");

  const { slug } = await params;
  const supabase = await createServerSupabase();
  const repo = createSupabaseEventRepository(supabase);
  const event = await repo.getBySlug(slug);

  if (!event) notFound();

  return (
    <main className="container max-w-2xl py-10">
      <Link
        href="/admin/eventos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a eventos
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="text-2xl font-bold">Editar evento</h1>
        <p className="mt-1 truncate text-sm text-muted-foreground">{event.title}</p>
      </header>

      <EditEventForm event={event} />
    </main>
  );
}
