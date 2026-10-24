import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import type { SiteSettings } from "@/lib/settings";

/** Page metadata with canonical URL and hreflang prepared for future locales. */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}): Metadata {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      // Only French exists today; ar/en will be added under /ar and /en.
      languages: { "fr-TD": url, "x-default": url },
    },
    openGraph: { title, description, url, type, locale: "fr_TD", siteName: "Africa Média" },
    twitter: { card: "summary_large_image", title, description },
  };
}

type Json = Record<string, unknown>;

/** Organization + ProfessionalService (LocalBusiness). Only facts present in site_settings are emitted. */
export function organizationJsonLd(s: SiteSettings): Json[] {
  const sameAs = Object.values(s.social_links).filter((u): u is string => typeof u === "string" && u.startsWith("https://"));
  const address: Json = { "@type": "PostalAddress", addressLocality: s.city, addressCountry: "TD" };
  if (s.address) address.streetAddress = s.address;
  const org: Json = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: s.brand_name,
    legalName: s.legal_name,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    address,
  };
  if (s.email) org.email = s.email;
  if (s.phone) org.telephone = s.phone;
  if (sameAs.length) org.sameAs = sameAs;

  const local: Json = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#agency`,
    name: s.brand_name,
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image.png`,
    address,
    areaServed: { "@type": "Country", name: "Tchad" },
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
  };
  if (s.phone) local.telephone = s.phone;
  return [org, local];
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path === "/" ? "" : it.path}`,
    })),
  };
}

export function serviceJsonLd(service: { title: string; summary: string; slug: string }): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.summary,
    url: `${SITE_URL}/services/${service.slug}`,
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: { "@type": "Country", name: "Tchad" },
  };
}

export function articleJsonLd(post: {
  title: string;
  excerpt: string;
  slug: string;
  published_at: string | null;
  updated_at: string;
  author_name: string;
  cover_url: string | null;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    url: `${SITE_URL}/journal/${post.slug}`,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: post.author_name },
    publisher: { "@id": `${SITE_URL}/#organization` },
    image: post.cover_url ?? `${SITE_URL}/opengraph-image.png`,
    inLanguage: "fr",
  };
}
