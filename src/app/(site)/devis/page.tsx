import { PageHero } from "@/components/content/page-hero";
import { QuoteForm } from "@/components/forms/quote-form";
import { getPackages } from "@/lib/content";
import { SERVICE_OPTIONS } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Devis et forfaits",
  description:
    "Demandez un devis de communication à Africa Média (N'Djamena) et découvrez la structure de nos forfaits mensuels. Prix sur devis.",
  path: "/devis",
});

// No advertising on this page (form).
export default async function QuotePage({ searchParams }: PageProps<"/devis">) {
  const [packages, params] = await Promise.all([getPackages(), searchParams]);
  const requested = typeof params.service === "string" ? params.service : undefined;
  const defaultService = SERVICE_OPTIONS.some((o) => o.value === requested) ? requested : undefined;

  return (
    <>
      <PageHero
        eyebrow="Devis et forfaits"
        title="Demander un devis"
        lede="Quatre étapes, environ trois minutes. Nous lisons chaque demande et revenons vers vous avec des questions précises avant d'envoyer une proposition écrite."
        crumbs={[{ name: "Devis et forfaits", path: "/devis" }]}
      />

      <div className="container-site grid gap-12 py-12 lg:grid-cols-[1.3fr_1fr]">
        <section aria-label="Formulaire de demande de devis" className="max-w-2xl">
          <QuoteForm packages={packages.map((p) => ({ slug: p.slug, name: p.name }))} defaultService={defaultService} />
        </section>

        <section id="forfaits" aria-labelledby="forfaits-title" className="scroll-mt-24">
          <h2 id="forfaits-title" className="h2 text-navy">
            Forfaits mensuels
          </h2>
          <p className="mt-2 text-slate">
            Trois formules pour une présence régulière. Le prix dépend du volume, des réseaux choisis et des déplacements :
            il est fixé sur devis.
          </p>
          <div className="mt-6 space-y-6">
            {packages.map((p) => (
              <article key={p.slug} className="rounded-lg border border-border p-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="h3 text-navy">{p.name}</h3>
                  <p className="font-heading font-bold text-gold-ink">{p.price_label}</p>
                </div>
                <p className="mt-1 text-sm text-slate">{p.audience}</p>
                <ul className="mt-3 space-y-1.5">
                  {p.includes.map((inc) => (
                    <li key={inc} className="flex gap-3 text-[0.98rem]">
                      <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gold" />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
