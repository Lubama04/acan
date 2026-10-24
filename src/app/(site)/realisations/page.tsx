import { notFound } from "next/navigation";
import { PageHero } from "@/components/content/page-hero";
import { CtaBand } from "@/components/sections/cta-band";
import { getCaseStudies } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Réalisations",
  description: "Études de cas d'Africa Média, publiées avec l'accord écrit de nos clients.",
  path: "/realisations",
});

// Hidden (404) until real case studies exist, each published with the client's written consent.
export default async function CaseStudiesPage() {
  const [settings, cases] = await Promise.all([getSettings(), getCaseStudies()]);
  if (!settings.feature_case_studies || cases.length === 0) notFound();

  return (
    <>
      <PageHero
        eyebrow="Réalisations"
        title="Ce que nous avons fait pour nos clients"
        lede="Chaque étude de cas est publiée avec l'accord écrit du client concerné."
        crumbs={[{ name: "Réalisations", path: "/realisations" }]}
      />
      <div className="container-site space-y-14 py-16">
        {cases.map((c) => (
          <article key={c.id} id={c.slug} className="grid gap-6 border-b border-border pb-14 last:border-0 lg:grid-cols-[1fr_1.5fr]">
            <header>
              <p className="eyebrow">{c.client_name}</p>
              <h2 className="h2 mt-1 text-navy">{c.title}</h2>
              <p className="lede mt-3">{c.summary}</p>
            </header>
            <dl className="space-y-5">
              {[
                ["Le besoin", c.challenge],
                ["Ce que nous avons fait", c.work_done],
                ["Résultats", c.results],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-heading font-bold text-navy">{k}</dt>
                    <dd className="mt-1 text-slate">{v}</dd>
                  </div>
                ))}
            </dl>
          </article>
        ))}
      </div>
      <CtaBand />
    </>
  );
}
