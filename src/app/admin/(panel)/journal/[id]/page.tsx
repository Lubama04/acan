import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { deletePost } from "../../actions";
import { PostForm, type EditablePost } from "../post-form";

export const metadata = { title: "Modifier un article" };

export default async function EditPostPage({ params, searchParams }: PageProps<"/admin/journal/[id]">) {
  const session = await requireAdmin("editor");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, slug, title, excerpt, body_md, category, cover_url, cover_alt, author_name, sponsored, sponsor_name, seo_title, seo_description, status",
    )
    .eq("id", id)
    .single();
  if (!post) notFound();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="h1 text-navy">Modifier l&apos;article</h1>
        {post.status === "published" && (
          <Link href={`/journal/${post.slug}`} className="link" target="_blank">
            Voir sur le site
          </Link>
        )}
      </div>
      <div className="mt-6">
        <PostForm post={post as EditablePost} saved={sp.saved === "1"} />
      </div>
      {session.roles.includes("admin") && (
        <form
          action={deletePost}
          className="border-destructive mt-8 flex flex-wrap items-end gap-2 rounded-lg border bg-white p-4"
        >
          <input type="hidden" name="id" value={post.id} />
          <label className="text-sm">
            Supprimer définitivement cet article : tapez SUPPRIMER
            <input name="confirm" className="field mt-1 max-w-48" autoComplete="off" />
          </label>
          <button type="submit" className="btn border-destructive text-destructive border">
            Supprimer
          </button>
        </form>
      )}
    </>
  );
}
