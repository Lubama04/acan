import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Journal" };

export default async function AdminPostsPage() {
  await requireAdmin("editor");
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, slug, status, sponsored, published_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="h1 text-navy">Journal</h1>
        <Link href="/admin/journal/nouveau" className="btn btn-primary">
          Nouvel article
        </Link>
      </div>
      <table className="mt-8 w-full border-collapse bg-white text-left text-sm">
        <thead>
          <tr className="border-b-2 border-navy">
            <th scope="col" className="p-3">Titre</th>
            <th scope="col" className="p-3">Statut</th>
            <th scope="col" className="p-3">Mis à jour</th>
          </tr>
        </thead>
        <tbody>
          {(posts ?? []).map((p) => (
            <tr key={p.id} className="border-b border-border">
              <td className="p-3">
                <Link href={`/admin/journal/${p.id}`} className="link font-semibold">
                  {p.title}
                </Link>
                {p.sponsored && <span className="ms-2 rounded bg-[#fffaf0] px-2 py-0.5 text-xs font-semibold">Sponsorisé</span>}
              </td>
              <td className="p-3">{p.status === "published" ? "Publié" : "Brouillon"}</td>
              <td className="p-3">{new Date(p.updated_at).toLocaleDateString("fr-FR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(posts ?? []).length === 0 && <p className="mt-6 text-slate">Aucun article pour le moment.</p>}
    </>
  );
}
