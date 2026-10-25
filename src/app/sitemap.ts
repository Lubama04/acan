import type { MetadataRoute } from "next";
import { getPosts, getServices } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, posts, settings] = await Promise.all([getServices(), getPosts(), getSettings()]);
  const staticPaths = [
    "",
    "/agence",
    "/services",
    "/secteurs",
    "/journal",
    "/devis",
    "/publicite",
    "/contact",
    "/mentions-legales",
    "/confidentialite",
    "/cookies",
    "/cgu",
    "/contenus-sponsorises",
  ];
  if (settings.feature_case_studies) staticPaths.push("/realisations");
  // The journal index is listed only once it has content (it is noindex while empty).
  if (posts.length === 0) staticPaths.splice(staticPaths.indexOf("/journal"), 1);

  return [
    ...staticPaths.map((p) => ({
      url: `${SITE_URL}${p}`,
      changeFrequency: "monthly" as const,
      priority: p === "" ? 1 : p.startsWith("/services") || p === "/devis" ? 0.8 : 0.5,
    })),
    ...services.map((s) => ({
      url: `${SITE_URL}/services/${s.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/journal/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
