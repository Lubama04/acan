import Link from "next/link";
import { LegalPage } from "@/components/content/legal-page";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Conditions d'utilisation",
  description: "Conditions générales d'utilisation du site d'Africa Média.",
  path: "/cgu",
});

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <LegalPage title="Conditions d'utilisation" path="/cgu" updated="24 octobre 2026">
      <h2>Objet</h2>
      <p>
        Ces conditions encadrent l&apos;utilisation du site d&apos;{s.brand_name}. En le consultant, vous les acceptez.
      </p>

      <h2>Contenus</h2>
      <p>
        Les articles du Journal donnent des conseils généraux. Ils ne remplacent pas un avis adapté à votre situation. Nous
        corrigeons les erreurs qui nous sont signalées et indiquons la date de mise à jour.
      </p>

      <h2>Formulaires</h2>
      <p>
        Vous vous engagez à fournir des informations exactes et à ne pas utiliser les formulaires pour envoyer des messages
        abusifs, publicitaires non sollicités ou malveillants. Les envois automatisés sont filtrés et peuvent être bloqués
        temporairement.
      </p>

      <h2>Devis</h2>
      <p>
        L&apos;envoi d&apos;une demande ne vaut pas commande. Un projet ne commence qu&apos;après acceptation écrite d&apos;une
        proposition détaillée (périmètre, délais, prix).
      </p>

      <h2>Liens</h2>
      <p>
        Les liens vers d&apos;autres sites sont fournis pour information ; nous ne sommes pas responsables de leur contenu.
        Les liens publicitaires sont signalés comme tels.
      </p>

      <h2>Responsabilité</h2>
      <p>
        Nous faisons notre possible pour que le site soit disponible et exact, sans pouvoir le garantir en permanence,
        notamment en cas de coupure du réseau ou de maintenance.
      </p>

      <h2>Droit applicable</h2>
      <p>
        Ces conditions relèvent du droit tchadien. En cas de litige, une solution amiable sera recherchée avant toute action
        devant les juridictions de N&apos;Djamena.
      </p>

      <p>
        Questions : <Link href="/contact">nous écrire</Link>.
      </p>
    </LegalPage>
  );
}
