import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LEGAL_NAV, MAIN_NAV } from "@/lib/site";
import { getSettings, isRegistered, legalFormLabel } from "@/lib/settings";
import { ConsentSettingsButton } from "@/components/consent/consent-settings-button";

export async function SiteFooter() {
  const s = await getSettings();
  const nav = MAIN_NAV.filter((item) => !item.flag || s[item.flag]);
  const socials = Object.entries(s.social_links).filter(
    ([, url]) => typeof url === "string" && url.startsWith("https://"),
  );

  return (
    <footer className="bg-navy mt-auto pb-20 text-white sm:pb-0">
      <div className="container-site grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo variant="white" className="h-10 w-auto" />
          <p className="text-mist mt-4 max-w-sm">
            Agence de communication basée à {s.city}. Institutions, ONG et entreprises.
          </p>
          <p className="text-mist mt-4 text-sm">
            {s.legal_name}
            {legalFormLabel(s) ? `, ${legalFormLabel(s)}` : ""}
            {isRegistered(s) ? (
              <>
                {" "}
                · RCCM {s.rccm} · NIF {s.nif}
              </>
            ) : legalFormLabel(s) ? null : (
              <> · {s.registration_status}</>
            )}
          </p>
          {(s.phone || s.email) && (
            <ul className="mt-4 space-y-1 text-sm">
              {s.phone && (
                <li>
                  <a
                    className="inline-flex min-h-11 items-center underline"
                    href={`tel:${s.phone.replace(/\s/g, "")}`}
                  >
                    {s.phone}
                  </a>
                </li>
              )}
              {s.email && (
                <li>
                  <a className="inline-flex min-h-11 items-center underline" href={`mailto:${s.email}`}>
                    {s.email}
                  </a>
                </li>
              )}
            </ul>
          )}
        </div>

        <nav aria-label="Plan du site">
          <h2 className="text-gold-light text-sm font-bold tracking-wide uppercase">L&apos;agence</h2>
          <ul className="mt-3">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center text-white/90 hover:text-white hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/devis"
                className="inline-flex min-h-11 items-center text-white/90 hover:text-white hover:underline"
              >
                Devis et forfaits
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Informations légales">
          <h2 className="text-gold-light text-sm font-bold tracking-wide uppercase">Informations</h2>
          <ul className="mt-3">
            {LEGAL_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center text-white/90 hover:text-white hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <ConsentSettingsButton className="min-h-11 text-start text-white/90 hover:text-white hover:underline" />
            </li>
          </ul>
          {socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-3" aria-label="Réseaux sociaux">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a href={url} rel="noopener noreferrer me" target="_blank" className="capitalize underline">
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </div>
      <div className="bg-gold h-1.5" aria-hidden="true" />
    </footer>
  );
}
