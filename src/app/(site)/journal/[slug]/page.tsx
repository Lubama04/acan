import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ads/ad-slot";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { Markdown } from "@/components/content/markdown";
import { PostMeta, SponsoredLabel } from "@/components/content/post-meta";
import { JsonLd } from "@/components/seo/json-ld";
import { getPost } from "@/lib/content";
import { articleJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/journal/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return pageMetadata({
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt,
    path: `/journal/${post.slug}`,
    type: "article",
  });
}

/** Splits the body in two at a paragraph boundary to place the in-article slot mid-text. */
function splitBody(md: string): [string, string] {
  const parts = md.split(/\n{2,}/);
  if (parts.length < 6) return [md, ""];
  const mid = Math.floor(parts.length / 2);
  return [parts.slice(0, mid).join("\n\n"), parts.slice(mid).join("\n\n")];
}

export default async function PostPage({ params }: PageProps<"/journal/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const [first, second] = splitBody(post.body_md);

  return (
    <>
      <div className="container-site pt-8">
        <Breadcrumbs
          items={[
            { name: "Journal", path: "/journal" },
            { name: post.title, path: `/journal/${post.slug}` },
          ]}
        />
      </div>
      <div className="container-site grid gap-12 py-10 lg:grid-cols-[1fr_300px]">
        <article>
          <header className="max-w-[68ch]">
            {post.sponsored && <SponsoredLabel sponsor={post.sponsor_name} />}
            <h1 className="h1 text-navy mt-3">{post.title}</h1>
            <div className="mt-3">
              <PostMeta post={post} />
            </div>
            <p className="lede mt-5">{post.excerpt}</p>
          </header>
          {post.cover_url && (
            <Image
              src={post.cover_url}
              alt={post.cover_alt ?? ""}
              width={1200}
              height={675}
              sizes="(max-width: 1024px) 100vw, 760px"
              priority
              className="mt-8 aspect-video w-full max-w-[760px] rounded-lg object-cover"
            />
          )}
          <div className="mt-8">
            <Markdown>{first}</Markdown>
            {second && (
              <>
                <AdSlot slot="in_article" className="my-10" />
                <Markdown>{second}</Markdown>
              </>
            )}
          </div>
          {post.sponsored && (
            <p className="text-slate mt-10 max-w-[68ch] text-sm">
              Cet article est un contenu sponsorisé{post.sponsor_name ? ` par ${post.sponsor_name}` : ""}.
              Voir notre{" "}
              <Link href="/contenus-sponsorises" className="link">
                politique des contenus sponsorisés
              </Link>
              .
            </p>
          )}
          <p className="mt-10">
            <Link href="/journal" className="link font-semibold">
              Retour au Journal
            </Link>
          </p>
        </article>
        <div className="lg:sticky lg:top-6 lg:self-start">
          <AdSlot slot="sidebar" />
        </div>
      </div>
      <div className="container-site pb-12">
        <AdSlot slot="footer" />
      </div>
      <JsonLd data={articleJsonLd(post)} />
    </>
  );
}
