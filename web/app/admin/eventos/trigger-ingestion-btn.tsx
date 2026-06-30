"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { RefreshCw } from "lucide-react";
import { triggerIngestionAction } from "./actions";
import type { IngestionSummary } from "@haku/events";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition hover:bg-muted disabled:opacity-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Ingestando…" : "Disparar Ingesta"}
    </button>
  );
}

export function TriggerIngestionBtn() {
  const [result, action] = useActionState<IngestionSummary | null, FormData>(
    async (_prev: IngestionSummary | null, _fd: FormData) => triggerIngestionAction(),
    null,
  );

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={action}>
        <SubmitBtn />
      </form>
      {result && (
        <div
          className={`rounded-md px-3 py-1.5 text-xs ${
            result.errors.length > 0
              ? "bg-destructive/10 text-destructive"
              : "bg-green-100 text-green-800"
          }`}
        >
          {result.errors.length > 0 ? (
            <span>Error: {result.errors.map((e) => e.message).join(", ")}</span>
          ) : (
            <span>
              {result.fetched} obtenidos · {result.inserted} insertados · {result.updated} actualizados
            </span>
          )}
        </div>
      )}
    </div>
  );
}
