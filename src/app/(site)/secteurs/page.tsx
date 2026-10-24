import { PageHero } from "@/components/content/page-hero";
import { CtaBand } from "@/components/sections/cta-band";
import { getSegments } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Secteurs : institutions, ONG, entreprises",
  description:
    "Comment Africa Média travaille avec les institutions publiques, les ONG et projets de développement, les entreprises, l'éducation, la santé, les entrepreneurs et les associations au Tchad.",
  path: "/secteurs",
});

export default async function SectorsPage() {
  const segments = await getSegments();
  return (
    <>
      <PageHero
        eyebrow="Secteurs"
        title="Une méthode adaptée à chaque type d'organisation"
        lede="Les procédures d'achat, les circuits de validation et les publics changent d'un secteur à l'autre. Voici ce que nous faisons pour chacun."
        crumbs={[{ name: "Secteurs", path: "/secteurs" }]}
      />
      <div className="container-site py-16">
        <nav aria-label="Secteurs" className="mb-12">
          <ul className="flex flex-wrap gap-2">
            {segments.map((s) => (
              <li key={s.slug}>
                <a href={`#${s.slug}`} className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold hover:bg-paper">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-16">
          {segments.map((s) => (
            <section key={s.slug} id={s.slug} aria-labelledby={`${s.slug}-title`} className="scroll-mt-24 grid gap-8 lg:grid-cols-[1fr_1fr]">
              <div>
                <h2 id={`${s.slug}-title`} className="h2 text-navy">
                  {s.title}
                </h2>
                <p className="lede mt-3">{s.summary}</p>
                <p className="mt-5 border-s-4 border-gold ps-4 font-heading text-lg font-bold text-navy">« {s.key_message} »</p>
              </div>
              <div className="rounded-lg bg-paper p-6">
                <h3 className="font-heading text-sm font-bold tracking-wide text-slate-paper uppercase">Besoins fréquents</h3>
                <ul className="mt-3 space-y-2">
                  {s.needs.map((n) => (
                    <li key={n} className="flex gap-3">
                      <span aria-hidden="true" className="mt-2.5 size-2 shrink-0 rounded-full bg-gold" />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
                <h3 className="mt-6 font-heading text-sm font-bold tracking-wide text-slate-paper uppercase">Notre façon de faire</h3>
                <p className="mt-2">{s.approach}</p>
              </div>
            </section>
          ))}
        </div>
        <p className="mt-16 max-w-3xl text-sm text-slate">
          Africa Média ne réalise pas de communication politique partisane.
        </p>
      </div>
      <CtaBand />
    </>
  );
}
