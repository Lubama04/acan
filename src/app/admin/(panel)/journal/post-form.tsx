"use client";

import { useActionState } from "react";
import { savePost, type ActionResult } from "../actions";

export type EditablePost = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  category: string;
  cover_url: string | null;
  cover_alt: string | null;
  author_name: string;
  sponsored: boolean;
  sponsor_name: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
};

const CATEGORIES = [
  ["conseils", "Conseils"],
  ["etudes-de-cas", "Études de cas"],
  ["actualites-agence", "Actualités de l'agence"],
  ["ressources", "Ressources"],
] as const;

export function PostForm({ post, saved }: { post?: EditablePost; saved?: boolean }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(savePost, {
    ok: Boolean(saved),
    message: saved ? "Article enregistré." : "",
  });
  return (
    <form action={action} className="space-y-5 rounded-lg border border-border bg-white p-6">
      {post?.id && <input type="hidden" name="id" value={post.id} />}
      {state.message && (
        <p role={state.ok ? "status" : "alert"} className={state.ok ? "font-semibold text-[#14532D]" : "field-error"}>
          {state.message}
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="field-label">Titre</span>
          <input name="title" defaultValue={post?.title} required minLength={5} maxLength={160} className="field" />
        </label>
        <label className="block">
          <span className="field-label">Slug (adresse)</span>
          <input name="slug" defaultValue={post?.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} className="field" />
        </label>
      </div>
      <label className="block">
        <span className="field-label">Chapeau (20 à 320 caractères)</span>
        <textarea name="excerpt" defaultValue={post?.excerpt} required minLength={20} maxLength={320} rows={2} className="field" />
      </label>
      <label className="block">
        <span className="field-label">Texte (Markdown : ## titre, **gras**, - liste, [lien](https://…))</span>
        <textarea name="body_md" defaultValue={post?.body_md} rows={18} className="field font-mono text-sm" />
      </label>
      <div className="grid gap-5 md:grid-cols-3">
        <label className="block">
          <span className="field-label">Rubrique</span>
          <select name="category" defaultValue={post?.category ?? "conseils"} className="field">
            {CATEGORIES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="field-label">Auteur</span>
          <input name="author_name" defaultValue={post?.author_name ?? "Africa Média"} maxLength={120} className="field" />
        </label>
        <label className="block">
          <span className="field-label">Statut</span>
          <select name="status" defaultValue={post?.status ?? "draft"} className="field">
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
          </select>
        </label>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="field-label">Image (URL https, facultatif)</span>
          <input name="cover_url" type="url" defaultValue={post?.cover_url ?? ""} className="field" />
        </label>
        <label className="block">
          <span className="field-label">Texte alternatif de l&apos;image</span>
          <input name="cover_alt" defaultValue={post?.cover_alt ?? ""} maxLength={200} className="field" />
        </label>
      </div>
      <fieldset className="rounded-md border border-border p-4">
        <legend className="px-1 font-semibold">Contenu sponsorisé</legend>
        <label className="flex items-center gap-3">
          <input type="checkbox" name="sponsored" defaultChecked={post?.sponsored} className="size-5 accent-blue" />
          Cet article est financé par un partenaire (la mention « Contenu sponsorisé » sera affichée)
        </label>
        <label className="mt-3 block">
          <span className="field-label">Nom du partenaire</span>
          <input name="sponsor_name" defaultValue={post?.sponsor_name ?? ""} maxLength={120} className="field" />
        </label>
      </fieldset>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="field-label">Titre SEO (70 max, facultatif)</span>
          <input name="seo_title" defaultValue={post?.seo_title ?? ""} maxLength={70} className="field" />
        </label>
        <label className="block">
          <span className="field-label">Description SEO (170 max, facultatif)</span>
          <input name="seo_description" defaultValue={post?.seo_description ?? ""} maxLength={170} className="field" />
        </label>
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
