import Link from "next/link";
import { AdSlot } from "@/components/ads/ad-slot";
import { PageHero } from "@/components/content/page-hero";
import { PostMeta, SponsoredLabel } from "@/components/content/post-meta";
import { getPosts } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Journal : conseils et ressources en communication",
  description:
    "Conseils pratiques de communication pour les organisations au Tchad, études de cas et actualités de l'agence Africa Média.",
  path: "/journal",
});

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
            <p className="lede">Les premiers articles arrivent bientôt.</p>
          ) : (
            <ul className="divide-y divide-border">
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
                    <p className="mt-3 text-slate">{p.excerpt}</p>
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
