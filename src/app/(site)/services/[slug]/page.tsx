import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/content/page-hero";
import { CtaBand } from "@/components/sections/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { getService, getServices } from "@/lib/content";
import { pageMetadata, serviceJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const s = await getService(slug);
  if (!s) return {};
  return pageMetadata({ title: `${s.title} à N'Djamena`, description: s.summary, path: `/services/${s.slug}` });
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const [service, all] = await Promise.all([getService(slug), getServices()]);
  if (!service) notFound();
  const others = all.filter((s) => s.slug !== service.slug);

  return (
    <>
      <PageHero
        eyebrow="Service"
        title={service.title}
        lede={service.summary}
        crumbs={[
          { name: "Services", path: "/services" },
          { name: service.title, path: `/services/${service.slug}` },
        ]}
      >
        <Link href={`/devis?service=${service.slug}`} className="btn btn-primary mt-8">
          Demander un devis pour ce service
        </Link>
      </PageHero>

      <div className="container-site grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="prose-am">{service.body_md}</p>

          <h2 className="h2 mt-12 text-navy">Ce que vous recevez</h2>
          <ul className="mt-4 space-y-2">
            {service.deliverables.map((d) => (
              <li key={d} className="flex gap-3">
                <span aria-hidden="true" className="mt-2.5 size-2 shrink-0 rounded-full bg-gold" />
                <span>{d}</span>
              </li>
            ))}
          </ul>

          <h2 className="h2 mt-12 text-navy">Déroulement</h2>
          <ol className="mt-4 space-y-4">
            {service.process.map((p, i) => (
              <li key={p} className="grid grid-cols-[2.5rem_1fr] items-baseline">
                <span className="font-heading text-lg font-extrabold text-gold-ink">{i + 1}.</span>
                <span>{p}</span>
              </li>
            ))}
          </ol>

          <p className="mt-10 text-slate">
            Prix : sur devis, selon le volume, les délais et les déplacements. Les déplacements hors de N&apos;Djamena sont
            chiffrés à part.
          </p>
        </div>

        <aside aria-labelledby="autres-services" className="lg:border-s lg:border-border lg:ps-10">
          <h2 id="autres-services" className="h3 text-navy">
            Autres services
          </h2>
          <ul className="mt-4 space-y-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/services/${o.slug}`} className="link font-semibold">
                  {o.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
      <JsonLd data={serviceJsonLd(service)} />
      <CtaBand />
    </>
  );
}
