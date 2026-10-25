import Link from "next/link";
import { AdSlot } from "@/components/ads/ad-slot";
import { PageHero } from "@/components/content/page-hero";
import { PostMeta, SponsoredLabel } from "@/components/content/post-meta";
import { getPosts } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

const META = {
  title: "Journal : conseils et ressources en communication",
  description:
    "Conseils pratiques de communication pour les organisations au Tchad, études de cas et actualités de l'agence Africa Média.",
  path: "/journal",
};

// An empty journal is kept out of search engines (thin content) until the first article is published.
export async function generateMetadata() {
  const posts = await getPosts();
  return posts.length > 0
    ? pageMetadata(META)
    : { ...pageMetadata(META), robots: { index: false, follow: true } };
}

export default async function JournalPage() {
  const posts = await getPosts();
  // No advertising on an empty page (AdSense "publisher content" policy).
  const showAds = posts.length > 0;
  return (
    <>
      <PageHero
        eyebrow="Journal"
        title="Conseils et ressources en communication"
        lede="Des articles pratiques pour mieux communiquer au Tchad, des études de cas et les nouvelles de l'agence. Pas d'actualité générale."
        crumbs={[{ name: "Journal", path: "/journal" }]}
      />
      {showAds && (
        <div className="container-site py-8">
          <AdSlot slot="header" />
        </div>
      )}
      <div className={`container-site grid gap-12 pb-16 lg:grid-cols-[1fr_300px] ${showAds ? "" : "pt-12"}`}>
        <div>
          {posts.length === 0 ? (
            <p className="lede">
              Aucun article n&apos;est encore publié. En attendant, nos{" "}
              <Link href="/services" className="link">
                services
              </Link>{" "}
              détaillent notre façon de travailler.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {posts.map((p) => (
                <li key={p.id} className="py-8 first:pt-0">
                  <article>
                    {p.sponsored && <SponsoredLabel sponsor={p.sponsor_name} />}
                    <h2 className="h3 mt-2">
                      <Link href={`/journal/${p.slug}`} className="text-navy hover:text-blue hover:underline">
                        {p.title}
                      </Link>
                    </h2>
                    <div className="mt-1">
                      <PostMeta post={p} />
                    </div>
                    <p className="text-slate mt-3">{p.excerpt}</p>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
        {showAds && (
          <div className="lg:sticky lg:top-6 lg:self-start">
            <AdSlot slot="sidebar" />
          </div>
        )}
      </div>
      {showAds && (
        <div className="container-site pb-12">
          <AdSlot slot="footer" />
        </div>
      )}
    </>
  );
}
