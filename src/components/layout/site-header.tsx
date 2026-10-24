import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MAIN_NAV } from "@/lib/site";
import { getSettings } from "@/lib/settings";

// Server component. The mobile menu uses <details>: it works without JavaScript.
export async function SiteHeader() {
  const settings = await getSettings();
  const nav = MAIN_NAV.filter((item) => !item.flag || settings[item.flag]);

  return (
    <header className="border-b border-border bg-white">
      <div className="container-site flex h-16 items-center justify-between gap-4 md:h-20">
        <Link href="/" className="shrink-0" aria-label="Africa Média, accueil">
          <Logo className="h-9 w-auto md:h-11" />
        </Link>

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-md px-3 py-2 text-[0.95rem] font-semibold text-navy hover:bg-paper"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/devis" className="btn btn-primary hidden sm:inline-flex">
            Demander un devis
          </Link>
          <details className="group relative lg:hidden">
            <summary
              className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-md border border-border text-navy [&::-webkit-details-marker]:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu aria-hidden="true" className="size-6" />
            </summary>
            <nav
              aria-label="Navigation mobile"
              className="absolute end-0 top-14 z-50 w-72 rounded-lg border border-border bg-white p-2 shadow-lg"
            >
              <ul>
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-md px-3 py-3 font-semibold text-navy hover:bg-paper"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li className="mt-2 border-t border-border pt-2">
                  <Link href="/devis" className="btn btn-primary w-full">
                    Demander un devis
                  </Link>
                </li>
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
