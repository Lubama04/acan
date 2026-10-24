import Image from "next/image";
import { PageHero } from "@/components/content/page-hero";
import { CtaBand } from "@/components/sections/cta-band";
import { SectionHeader } from "@/components/sections/section-header";
import { getTeam } from "@/lib/content";
import { getSettings, isRegistered } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "L'agence",
  description:
    "Africa Média est une agence de communication basée à N'Djamena. Sa mission, ses valeurs et sa façon de travailler.",
  path: "/agence",
});

const VALUES = [
  {
    title: "L'exactitude",
    text: "Nous ne publions rien que nous ne puissions vérifier : ni chiffre inventé, ni référence imaginaire, ni promesse de résultat que personne ne peut tenir.",
  },
  {
    title: "Le respect des personnes",
    text: "Les femmes, les hommes et les enfants que nous photographions ou citons ont donné leur accord. Leur dignité passe avant l'effet visuel.",
  },
  {
    title: "La clarté",
    text: "Des phrases courtes, des images lisibles, des fichiers légers. Une bonne communication se comprend sur un téléphone, avec une connexion lente.",
  },
  {
    title: "La transparence",
    text: "Un devis écrit, un calendrier, un interlocuteur. Les contenus sponsorisés sont signalés, sans exception.",
  },
];

export default async function AgencyPage() {
  const [settings, team] = await Promise.all([getSettings(), getTeam()]);
  const showTeam = settings.feature_team && team.length > 0;

  return (
    <>
      <PageHero
        eyebrow="L'agence"
        title="Une agence de communication tchadienne, au service de ceux qui agissent"
        lede="Africa Média accompagne les institutions, les ONG et les entreprises qui ont besoin d'expliquer leur action à des publics variés, au Tchad et au-delà."
        crumbs={[{ name: "L'agence", path: "/agence" }]}
      />

      <section className="py-16" aria-labelledby="mission-title">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <SectionHeader id="mission-title" eyebrow="Mission" title="Rendre votre action compréhensible" />
          <div className="space-y-4 text-lg">
            <p>
              Beaucoup d&apos;organisations font un travail utile que personne ne connaît : un projet de santé dans le Ouaddaï,
              une PME qui recrute à N&apos;Djamena, un service public qui change ses horaires. L&apos;information existe, mais elle
              n&apos;arrive pas aux bonnes personnes, ou pas sous la bonne forme.
            </p>
            <p>
              Notre métier est de transformer cette information en messages clairs, en images justes et en contenus que les
              gens lisent vraiment, sur les canaux qu&apos;ils utilisent : radio, presse, Facebook, TikTok, WhatsApp.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-paper py-16" aria-labelledby="valeurs-title">
        <div className="container-site">
          <SectionHeader id="valeurs-title" eyebrow="Valeurs" title="Quatre règles que nous appliquons à chaque projet" />
          <dl className="mt-10 grid gap-8 md:grid-cols-2">
            {VALUES.map((v) => (
              <div key={v.title} className="border-t-2 border-navy pt-4">
                <dt className="h3 text-navy">{v.title}</dt>
                <dd className="mt-2 text-slate-paper">{v.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {showTeam && (
        <section className="py-16" aria-labelledby="equipe-title">
          <div className="container-site">
            <SectionHeader id="equipe-title" eyebrow="Équipe" title="Les porteurs du projet" />
            <ul className="mt-10 grid gap-10 md:grid-cols-2">
              {team.map((m) => (
                <li key={m.id} className="grid gap-5 sm:grid-cols-[8rem_1fr]">
                  {m.photo_url ? (
                    <Image
                      src={m.photo_url}
                      alt={m.photo_alt ?? `Portrait de ${m.full_name}`}
                      width={128}
                      height={160}
                      className="h-40 w-32 rounded-md object-cover"
                    />
                  ) : (
                    <div aria-hidden="true" className="hidden h-40 w-32 rounded-md bg-paper sm:block" />
                  )}
                  <div>
                    <h3 className="h3 text-navy">{m.full_name}</h3>
                    <p className="font-semibold text-gold-ink">{m.role}</p>
                    <p className="mt-2 text-slate">{m.bio}</p>
                    {m.experience.length > 0 && (
                      <ul className="mt-3 list-disc space-y-1 ps-5 text-sm text-slate">
                        {m.experience.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="border-t border-border py-12" aria-labelledby="statut-title">
        <div className="container-site">
          <h2 id="statut-title" className="h3 text-navy">
            Statut de l&apos;entreprise
          </h2>
          <p className="notice mt-4 max-w-3xl">
            {settings.legal_name}
            {settings.legal_form ? ` (${settings.legal_form})` : ""}, {settings.city}, {settings.country}.{" "}
            {isRegistered(settings)
              ? `RCCM ${settings.rccm} · NIF ${settings.nif}.`
              : `Société ${settings.registration_status} : les numéros RCCM et NIF seront publiés ici dès leur délivrance.`}
          </p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
