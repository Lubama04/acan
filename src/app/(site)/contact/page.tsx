import Link from "next/link";
import { PageHero } from "@/components/content/page-hero";
import { ContactForm } from "@/components/forms/contact-form";
import { CONTACT_TOPICS } from "@/lib/site";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description: "Contacter Africa Média, agence de communication à N'Djamena : formulaire, WhatsApp, e-mail.",
  path: "/contact",
});

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const [s, params] = await Promise.all([getSettings(), searchParams]);
  const topic = CONTACT_TOPICS.some((t) => t.value === params.sujet) ? String(params.sujet) : undefined;
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Nous écrire"
        lede={
          <>
            Pour un projet précis, le{" "}
            <Link href="/devis" className="link">
              formulaire de devis
            </Link>{" "}
            nous donne d&apos;emblée les bonnes informations. Pour tout le reste, c&apos;est ici.
          </>
        }
        crumbs={[{ name: "Contact", path: "/contact" }]}
      />
      <div className="container-site grid gap-12 py-12 lg:grid-cols-[1.3fr_1fr]">
        <section aria-label="Formulaire de contact" className="max-w-2xl">
          <ContactForm defaultTopic={topic} />
        </section>
        <aside aria-labelledby="coordonnees-title" className="space-y-6">
          <h2 id="coordonnees-title" className="h3 text-navy">
            Coordonnées
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="font-semibold">Ville</dt>
              <dd className="text-slate">
                {s.address ? `${s.address}, ` : ""}
                {s.city}, {s.country}
              </dd>
            </div>
            {s.phone && (
              <div>
                <dt className="font-semibold">Téléphone</dt>
                <dd>
                  <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="link">
                    {s.phone}
                  </a>
                </dd>
              </div>
            )}
            {s.email && (
              <div>
                <dt className="font-semibold">E-mail</dt>
                <dd>
                  <a href={`mailto:${s.email}`} className="link">
                    {s.email}
                  </a>
                </dd>
              </div>
            )}
            {whatsapp && /^\d{8,15}$/.test(whatsapp) && (
              <div>
                <dt className="font-semibold">WhatsApp</dt>
                <dd>
                  <a href={`https://wa.me/${whatsapp}`} className="link" target="_blank" rel="noopener noreferrer">
                    Écrire sur WhatsApp
                  </a>
                </dd>
              </div>
            )}
          </dl>
          {!s.phone && !s.email && (
            <p className="notice text-sm">
              Le téléphone et l&apos;adresse e-mail de l&apos;agence seront publiés ici prochainement. Le formulaire est
              opérationnel.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
