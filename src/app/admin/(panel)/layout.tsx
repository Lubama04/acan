import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { requireAdmin } from "@/lib/auth/admin";
import { signOut } from "../auth-actions";

const NAV = [
  { href: "/admin", label: "Tableau de bord", role: "editor" },
  { href: "/admin/demandes", label: "Demandes", role: "admin" },
  { href: "/admin/journal", label: "Journal", role: "editor" },
  { href: "/admin/publicite", label: "Publicité", role: "admin" },
  { href: "/admin/parametres", label: "Paramètres", role: "admin" },
  { href: "/admin/securite", label: "Sécurité", role: "admin" },
] as const;

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin("editor");
  const isAdmin = session.roles.includes("admin");
  return (
    <div className="min-h-full">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link href="/admin" aria-label="Tableau de bord">
            <Logo className="h-8 w-auto" />
          </Link>
          <nav aria-label="Administration">
            <ul className="flex flex-wrap gap-1">
              {NAV.filter((n) => n.role === "editor" || isAdmin).map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="rounded-md px-3 py-2 text-sm font-semibold text-navy hover:bg-paper">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate">{session.email}</span>
            <form action={signOut}>
              <button type="submit" className="link">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
