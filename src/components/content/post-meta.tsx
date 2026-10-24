import { POST_CATEGORY_LABELS } from "@/lib/site";
import type { Post } from "@/lib/types";

export const formatDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Ndjamena" }).format(new Date(iso)) : "";

export function SponsoredLabel({ sponsor }: { sponsor: string | null }) {
  return (
    <p className="notice inline-block text-sm font-semibold">
      Contenu sponsorisé{sponsor ? ` · ${sponsor}` : ""}
    </p>
  );
}

export function PostMeta({ post }: { post: Pick<Post, "category" | "published_at" | "author_name"> }) {
  return (
    <p className="text-sm text-slate">
      <span className="font-semibold text-gold-ink">{POST_CATEGORY_LABELS[post.category]}</span>
      {" · "}
      <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time>
      {" · "}
      {post.author_name}
    </p>
  );
}
