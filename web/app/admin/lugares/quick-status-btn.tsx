"use client";

import { useTransition } from "react";
import { quickStatusAction } from "./actions";
import type { Venue } from "@haku/core";

const NEXT: Record<Venue["status"], { target: Venue["status"]; label: string; cls: string } | null> = {
  draft:     { target: "published", label: "Publicar",   cls: "bg-primary text-primary-foreground hover:opacity-90" },
  published: { target: "archived",  label: "Archivar",   cls: "border hover:border-primary/40" },
  archived:  { target: "draft",     label: "Reactivar",  cls: "border hover:border-primary/40" },
};

export function QuickStatusBtn({ id, slug, status }: { id: string; slug: string; status: Venue["status"] }) {
  const [pending, start] = useTransition();
  const next = NEXT[status];
  if (!next) return null;

  return (
    <form
      action={(fd) => {
        fd.set("id", id);
        fd.set("slug", slug);
        fd.set("status", next.target);
        start(() => quickStatusAction(fd));
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="status" value={next.target} />
      <button
        type="submit"
        disabled={pending}
        className={`rounded-md px-3 py-1.5 text-sm transition disabled:opacity-50 ${next.cls}`}
      >
        {pending ? "…" : next.label}
      </button>
    </form>
  );
}
