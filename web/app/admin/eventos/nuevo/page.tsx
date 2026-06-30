import { requireProfile } from "@/lib/auth";
import { NewEventForm } from "./new-event-form";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  await requireProfile("admin");

  return (
    <main className="container py-10">
      <h1 className="text-2xl font-bold">Nuevo evento</h1>
      <p className="mt-1 text-muted-foreground">
        Se publica directamente por defecto. Cambia el estado si necesitas dejarlo pendiente.
      </p>
      <div className="mt-8 max-w-2xl">
        <NewEventForm />
      </div>
    </main>
  );
}
