import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand/mark";
import { CtaBand } from "@/components/sections/cta-band";
import { SectionHeader } from "@/components/sections/section-header";
import { getPackages, getSegments, getServices } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Africa Média — Agence de communication à N'Djamena, Tchad",
  description:
    "Agence de communication à N'Djamena pour institutions, ONG et entreprises : communication institutionnelle, réseaux sociaux, photo et vidéo, rédaction, relations presse.",
  path: "/",
  absoluteTitle: true,
});

const STEPS = [
  {
    title: "Premier échange",
    text: "Un entretien pour comprendre votre organisation, vos publics et vos contraintes : délais, validation, budget.",
  },
  {
    title: "Proposition écrite",
    text: "Objectifs, messages, livrables, calendrier et prix. Rien ne commence sans votre accord écrit.",
  },
  {
    title: "Production",
    text: "Nous produisons, vous validez à chaque étape. Un seul interlocuteur suit votre dossier.",
  },
  {
    title: "Bilan",
    text: "Ce qui a été fait, ce qui a marché, ce qu'on change. Les chiffres présentés sont ceux que nous avons mesurés.",
  },
];

const COMMITMENTS = [
  "Un devis écrit avant tout travail, sans frais cachés.",
  "L'accord des personnes photographiées en gros plan, et une autorisation écrite pour les témoignages et pour les mineurs (avec l'accord d'un parent).",
  "Les contenus payés ou partenaires sont toujours signalés comme tels.",
  "Aucune promesse de parution dans la presse : nous ne payons pas les journalistes.",
  "Vos documents sont traités de façon confidentielle ; un accord de confidentialité peut être signé.",
];

export default async function HomePage() {
  const [services, segments, packages] = await Promise.all([getServices(), getSegments(), getPackages()]);

  return (
    <>
      {/* Hero */}
      <section className="border-border bg-paper border-b">
        <div className="container-site grid items-center gap-10 py-14 md:grid-cols-[1.5fr_1fr] md:py-20">
          <div>
            <p className="eyebrow">Agence de communication · N&apos;Djamena</p>
            <h1 className="display text-navy mt-3">
              Faire comprendre ce que vous faites, à ceux qui doivent le savoir.
            </h1>
            <p className="lede mt-5 max-w-2xl">
              Africa Média aide les institutions, les ONG et les entreprises du Tchad à expliquer leur action
              : communication institutionnelle, réseaux sociaux, production photo et vidéo, rédaction et
              relations presse.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/devis" className="btn btn-primary">
                Demander un devis
              </Link>
              <Link href="/services" className="btn btn-secondary">
                Voir nos services
              </Link>
            </div>
          </div>
          <div className="relative hidden justify-self-center md:block" aria-hidden="true">
            <BrandMark className="size-64 lg:size-80" />
          </div>
        </div>
      </section>

      {/* Services: numbered list, not a card grid */}
      <section className="py-16 md:py-24" aria-labelledby="services-title">
        <div className="container-site">
          <SectionHeader
            id="services-title"
            eyebrow="Ce que nous faisons"
            title="Cinq métiers, un seul interlocuteur"
            lede="Vous pouvez nous confier un seul de ces métiers ou les combiner dans un accompagnement mensuel."
          />
          <ol className="divide-border border-border mt-10 divide-y border-y">
            {services.map((s, i) => (
              <li key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="group grid gap-2 py-6 no-underline md:grid-cols-[4rem_1fr_2fr_auto] md:items-baseline md:gap-6"
                >
                  <span className="font-heading text-gold-ink text-2xl font-extrabold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="h3 text-navy group-hover:text-blue">{s.title}</span>
                  <span className="text-slate">{s.summary}</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="text-blue hidden size-5 md:block rtl:-scale-x-100"
                  />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Sectors: split layout */}
      <section className="bg-paper py-16 md:py-24" aria-labelledby="secteurs-title">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <SectionHeader
            id="secteurs-title"
            eyebrow="Pour qui"
            title="Des organisations qui doivent rendre des comptes"
            lede="Un ministère, une ONG et une PME ne communiquent pas de la même façon. Nous adaptons nos méthodes à vos procédures et à vos publics."
          />
          <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {segments.map((seg) => (
              <li key={seg.slug} className="border-gold border-s-4 ps-4">
                <h3 className="font-heading text-navy text-lg font-bold">{seg.title}</h3>
                <p className="text-slate-paper mt-1">{seg.key_message}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="container-site mt-8">
          <Link href="/secteurs" className="link font-semibold">
            Voir comment nous travaillons avec chaque secteur
          </Link>
        </div>
      </section>

      {/* Method */}
      <section className="py-16 md:py-24" aria-labelledby="methode-title">
        <div className="container-site">
          <SectionHeader id="methode-title" eyebrow="Méthode" title="Comment se déroule un projet" />
          <ol className="mt-10 grid gap-8 md:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <p className="font-heading text-gold-ink text-sm font-bold">Étape {i + 1}</p>
                <h3 className="h3 text-navy mt-1">{step.title}</h3>
                <p className="text-slate mt-2">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Commitments + packages */}
      <section className="border-border border-t py-16 md:py-24" aria-labelledby="engagements-title">
        <div className="container-site grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader
              id="engagements-title"
              eyebrow="Nos engagements"
              title="Ce que vous pouvez exiger de nous"
            />
            <ul className="mt-6 space-y-3">
              {COMMITMENTS.map((c) => (
                <li key={c} className="flex gap-3">
                  <span aria-hidden="true" className="bg-gold mt-2.5 size-2 shrink-0 rounded-full" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-border rounded-lg border p-6 md:p-8">
            <h2 className="h3 text-navy">Forfaits mensuels</h2>
            <p className="text-slate mt-2">
              Pour une présence régulière, trois formules à adapter. Les prix dépendent du volume et sont
              établis sur devis.
            </p>
            <table className="mt-5 w-full text-start">
              <caption className="sr-only">Forfaits mensuels</caption>
              <thead>
                <tr className="border-border text-slate border-b text-sm">
                  <th scope="col" className="py-2 font-semibold">
                    Formule
                  </th>
                  <th scope="col" className="py-2 font-semibold">
                    Pour qui
                  </th>
                  <th scope="col" className="py-2 text-end font-semibold">
                    Prix
                  </th>
                </tr>
              </thead>
              <tbody>
                {packages.map((p) => (
                  <tr key={p.slug} className="border-border border-b align-top">
                    <th scope="row" className="font-heading text-navy py-3 pe-3 font-bold">
                      {p.name}
                    </th>
                    <td className="text-slate py-3 pe-3 text-sm">{p.audience}</td>
                    <td className="py-3 text-end text-sm font-semibold whitespace-nowrap">{p.price_label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Link href="/devis#forfaits" className="link mt-5 inline-block font-semibold">
              Détail des forfaits
            </Link>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
