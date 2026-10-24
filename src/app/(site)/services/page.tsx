import Link from "next/link";
import { PageHero } from "@/components/content/page-hero";
import { CtaBand } from "@/components/sections/cta-band";
import { getServices } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Services de communication au Tchad",
  description:
    "Communication institutionnelle, gestion des réseaux sociaux, production photo et vidéo, rédaction de contenus et relations presse à N'Djamena.",
  path: "/services",
});

export default async function ServicesPage() {
  const services = await getServices();
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Ce que nous faisons pour vous"
        lede="Chaque service peut être commandé seul, pour une mission ponctuelle, ou intégré à un forfait mensuel."
        crumbs={[{ name: "Services", path: "/services" }]}
      />
      <div className="container-site py-16">
        <ol className="space-y-14">
          {services.map((s, i) => (
            <li key={s.slug} className="grid gap-6 border-b border-border pb-14 last:border-0 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <p className="font-heading text-3xl font-extrabold text-gold-ink">{String(i + 1).padStart(2, "0")}</p>
                <h2 className="h2 mt-1 text-navy">{s.title}</h2>
                <p className="lede mt-3">{s.summary}</p>
                <Link href={`/services/${s.slug}`} className="btn btn-secondary mt-6">
                  En savoir plus<span className="sr-only"> sur {s.title}</span>
                </Link>
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold tracking-wide text-slate uppercase">Ce que vous recevez</h3>
                <ul className="mt-3 space-y-2">
                  {s.deliverables.map((d) => (
                    <li key={d} className="flex gap-3">
                      <span aria-hidden="true" className="mt-2.5 size-2 shrink-0 rounded-full bg-gold" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <CtaBand />
    </>
  );
}
