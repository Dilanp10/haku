"use client";

import { useTransition } from "react";
import type { EventStatus } from "@haku/shared";
import { quickEventStatusAction } from "./actions";

interface Transition {
  target: EventStatus;
  label: string;
  cls: string;
}

const NEXT: Record<EventStatus, Transition | null> = {
  pending:   { target: "published", label: "Publicar",    cls: "bg-primary text-primary-foreground hover:opacity-90" },
  published: { target: "rejected",  label: "Retirar",     cls: "border hover:border-destructive/50 hover:text-destructive" },
  rejected:  { target: "pending",   label: "Reactivar",   cls: "border hover:border-primary/50 hover:text-primary" },
};

export function QuickEventStatusBtn({
  id,
  status,
}: {
  id: string;
  status: EventStatus;
}) {
  const [pending, start] = useTransition();
  const t = NEXT[status];
  if (!t) return null;

  return (
    <form
      action={(fd) => {
        start(() => quickEventStatusAction(fd));
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={t.target} />
      <button
        type="submit"
        disabled={pending}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${t.cls}`}
      >
        {pending ? "..." : t.label}
      </button>
    </form>
  );
}
