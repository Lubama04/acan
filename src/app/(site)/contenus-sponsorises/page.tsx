import Link from "next/link";
import { LegalPage } from "@/components/content/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Politique des contenus sponsorisés",
  description: "Comment Africa Média signale la publicité et les contenus financés par des partenaires.",
  path: "/contenus-sponsorises",
});

export default function SponsoredPolicyPage() {
  return (
    <LegalPage title="Politique des contenus sponsorisés" path="/contenus-sponsorises" updated="24 octobre 2026">
      <h2>Le principe</h2>
      <p>
        Vous devez toujours savoir si un contenu a été payé. Toute publicité, tout article financé ou co-écrit avec un
        partenaire est signalé, sans exception.
      </p>

      <h2>Les mentions utilisées</h2>
      <ul>
        <li>
          <strong>Publicité</strong> : bannière ou visuel acheté par un annonceur, au-dessus de l&apos;emplacement.
        </li>
        <li>
          <strong>Sponsorisé</strong> : emplacement financé par un partenaire identifié.
        </li>
        <li>
          <strong>Contenu sponsorisé</strong> : article financé par un partenaire, dont le nom est indiqué en haut et en
          bas de l&apos;article.
        </li>
      </ul>

      <h2>Nos règles</h2>
      <ul>
        <li>Le nom du partenaire est toujours affiché.</li>
        <li>Un contenu sponsorisé doit être utile au lecteur : il n&apos;est pas une publicité déguisée en information.</li>
        <li>Nous gardons la décision finale de publier ou non un texte.</li>
        <li>Nous refusons la propagande politique partisane et les produits ou services illégaux au Tchad.</li>
        <li>Les liens publicitaires portent l&apos;attribut « sponsored » destiné aux moteurs de recherche.</li>
        <li>Nous n&apos;incitons jamais à cliquer sur une annonce.</li>
      </ul>

      <h2>Signaler un problème</h2>
      <p>
        Un contenu vous semble mal signalé ? <Link href="/contact?sujet=publicite">Écrivez-nous</Link> : nous corrigeons
        rapidement.
      </p>
    </LegalPage>
  );
}
