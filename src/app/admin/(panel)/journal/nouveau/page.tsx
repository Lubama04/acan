import { requireAdmin } from "@/lib/auth/admin";
import { PostForm } from "../post-form";

export const metadata = { title: "Nouvel article" };

export default async function NewPostPage() {
  await requireAdmin("editor");
  return (
    <>
      <h1 className="h1 text-navy">Nouvel article</h1>
      <p className="mt-2 text-slate">
        Contenu d&apos;agence uniquement : conseils, études de cas autorisées, actualités de l&apos;agence, ressources. Pas
        d&apos;actualité générale ni de politique partisane.
      </p>
      <div className="mt-6">
        <PostForm />
      </div>
    </>
  );
}
