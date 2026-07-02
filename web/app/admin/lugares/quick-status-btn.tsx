"use client";

import { useTransition } from "react";
import { quickStatusAction } from "./actions";
import type { Venue } from "@haku/core";

const NEXT: Record<
  Venue["status"],
  { target: Venue["status"]; label: string; primary: boolean } | null
> = {
  draft: { target: "published", label: "Publicar", primary: true },
  published: { target: "archived", label: "Archivar", primary: false },
  archived: { target: "draft", label: "Reactivar", primary: false },
};

export function QuickStatusBtn({
  id,
  slug,
  status,
}: {
  id: string;
  slug: string;
  status: Venue["status"];
}) {
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
      <button
        type="submit"
        disabled={pending}
        className="rounded-[8px] px-2.5 py-1 text-xs font-medium transition active:opacity-80 disabled:opacity-50"
        style={
          next.primary
            ? { background: "var(--terra)", color: "#fff" }
            : { border: "1px solid var(--line-2)", color: "var(--fg-70)" }
        }
      >
        {pending ? "…" : next.label}
      </button>
    </form>
  );
}
