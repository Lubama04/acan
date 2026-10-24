import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Tableau de bord" };

async function count(table: string, filter?: [string, string]) {
  const supabase = await createClient();
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = q.eq(filter[0], filter[1]);
  const { count: c } = await q;
  return c ?? 0;
}

export default async function DashboardPage() {
  const session = await requireAdmin("editor");
  const isAdmin = session.roles.includes("admin");
  const [leads, messages, drafts, published, incidents] = await Promise.all([
    isAdmin ? count("leads", ["status", "new"]) : Promise.resolve(0),
    isAdmin ? count("contact_messages", ["status", "new"]) : Promise.resolve(0),
    count("posts", ["status", "draft"]),
    count("posts", ["status", "published"]),
    isAdmin ? count("incidents", ["status", "ouvert"]) : Promise.resolve(0),
  ]);

  const tiles = [
    ...(isAdmin
      ? [
          { label: "Nouvelles demandes de devis", value: leads, href: "/admin/demandes" },
          { label: "Nouveaux messages", value: messages, href: "/admin/demandes#messages" },
          { label: "Incidents de sécurité ouverts", value: incidents, href: "/admin/securite" },
        ]
      : []),
    { label: "Brouillons", value: drafts, href: "/admin/journal" },
    { label: "Articles publiés", value: published, href: "/admin/journal" },
  ];

  return (
    <>
      <h1 className="h1 text-navy">Tableau de bord</h1>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="block rounded-lg border border-border bg-white p-5 no-underline hover:border-navy">
              <p className="font-heading text-4xl font-extrabold text-navy">{t.value}</p>
              <p className="mt-1 text-slate">{t.label}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
