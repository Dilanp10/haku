"use client";

import { useEffect } from "react";

export function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/venues/${slug}/view`, { method: "POST" });
  }, [slug]);
  return null;
}
