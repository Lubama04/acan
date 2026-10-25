import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { MAIN_NAV } from "@/lib/site";
import { getSettings } from "@/lib/settings";
import { DesktopNav, MobileNav } from "./header-nav";

export async function SiteHeader() {
  const settings = await getSettings();
  const nav = MAIN_NAV.filter((item) => !item.flag || settings[item.flag]).map(({ href, label }) => ({
    href,
    label,
  }));

  return (
    <header className="border-border border-b bg-white">
      <div className="container-site flex h-16 items-center justify-between gap-4 md:h-20">
        <Link href="/" className="shrink-0" aria-label="Africa Média, accueil">
          <Logo className="h-9 w-auto md:h-11" />
        </Link>
        <DesktopNav items={nav} />
        <div className="flex items-center gap-2">
          <Link href="/devis" className="btn btn-primary hidden sm:inline-flex">
            Demander un devis
          </Link>
          <MobileNav items={nav} />
        </div>
      </div>
    </header>
  );
}
