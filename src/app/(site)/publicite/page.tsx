import Link from "next/link";
import { PageHero } from "@/components/content/page-hero";
import { getAdSlots } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Publicité et partenariats",
  description:
    "Annoncer sur le site d'Africa Média : formats, emplacements, règles d'étiquetage et demande de tarifs.",
  path: "/publicite",
});

const PLACEMENT_HELP: Record<string, string> = {
  header: "En haut des pages du Journal.",
  in_article: "Au milieu des articles longs du Journal.",
  sidebar: "À droite des articles, sur ordinateur uniquement.",
  footer: "En bas des pages du Journal.",
};

export default async function AdvertisingPage() {
  const [slots, settings] = await Promise.all([getAdSlots(), getSettings()]);

  return (
    <>
      <PageHero
        eyebrow="Publicité et partenariats"
        title="Annoncer sur le site d'Africa Média"
        lede="Des emplacements sobres, réservés au Journal, toujours étiquetés « Publicité » ou « Sponsorisé »."
        crumbs={[{ name: "Publicité", path: "/publicite" }]}
      />
      <div className="container-site grid gap-12 py-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="h2 text-navy">Formats disponibles</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left">
              <caption className="sr-only">Emplacements publicitaires</caption>
              <thead>
                <tr className="border-b-2 border-navy text-sm">
                  <th scope="col" className="py-2 pe-4">Emplacement</th>
                  <th scope="col" className="py-2 pe-4">Format (pixels)</th>
                  <th scope="col" className="py-2">Où</th>
                </tr>
              </thead>
              <tbody>
                {slots
                  .filter((s) => s.enabled)
                  .map((s) => (
                    <tr key={s.key} className="border-b border-border align-top">
                      <th scope="row" className="py-3 pe-4 font-semibold">{s.label}</th>
                      <td className="py-3 pe-4">
                        {s.width} × {s.height}
                        {(s.key === "header" || s.key === "footer") && (
                          <span className="block text-sm text-slate">320 × 100 sur mobile</span>
                        )}
                      </td>
                      <td className="py-3 text-slate">{PLACEMENT_HELP[s.key]}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <h2 className="h2 mt-12 text-navy">Contenus sponsorisés</h2>
          <p className="mt-3">
            Un partenaire peut financer un article utile à nos lecteurs (guide pratique, retour d&apos;expérience). L&apos;article
            porte la mention « Contenu sponsorisé » et le nom du partenaire, en haut et en bas de page. Nous gardons la
            décision finale sur le texte publié.{" "}
            <Link href="/contenus-sponsorises" className="link">
              Lire notre politique
            </Link>
            .
          </p>

          <h2 className="h2 mt-12 text-navy">Ce que nous refusons</h2>
          <ul className="mt-3 list-disc space-y-1.5 ps-5">
            <li>La propagande politique partisane.</li>
            <li>Les produits ou services illégaux au Tchad, les jeux d&apos;argent non autorisés, les produits de santé non homologués.</li>
            <li>Les publicités trompeuses ou déguisées en information.</li>
            <li>Les annonces sur les pages légales, les formulaires et l&apos;espace d&apos;administration.</li>
          </ul>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg bg-paper p-6">
            <h2 className="h3 text-navy">Tarifs</h2>
            <p className="mt-2">
              Tarifs sur demande, selon l&apos;emplacement et la durée. Les statistiques d&apos;affichage et de clics sont
              comptées côté serveur, avec filtrage des robots et des clics répétés.
            </p>
            {settings.feature_media_kit ? (
              <p className="mt-3 font-semibold">Le kit média est disponible sur demande.</p>
            ) : (
              <p className="mt-3 text-sm text-slate">Le kit média (audience, formats, conditions) est en préparation.</p>
            )}
            <Link href="/contact?sujet=publicite" className="btn btn-primary mt-5">
              Demander les tarifs
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
