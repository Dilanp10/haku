import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = env.appUrl.replace(/\/+$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/lugares", "/lugares/", "/eventos", "/eventos/"],
        disallow: ["/admin", "/admin/", "/login", "/api", "/lugares/cerca"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
