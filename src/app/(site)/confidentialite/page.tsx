import Link from "next/link";
import { LegalPage } from "@/components/content/legal-page";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Politique de confidentialité",
  description:
    "Comment Africa Média collecte, utilise et protège vos données personnelles, et comment exercer vos droits.",
  path: "/confidentialite",
});

export default async function PrivacyPage() {
  const s = await getSettings();
  const contact = s.privacy_contact_email ?? s.email;

  return (
    <LegalPage title="Politique de confidentialité" path="/confidentialite" updated="24 octobre 2026">
      <p>
        Cette politique explique quelles données nous collectons sur ce site, pourquoi, combien de temps nous les gardons et
        comment exercer vos droits. Elle s&apos;appuie sur la loi tchadienne n° 007/PR/2015 portant protection des données à
        caractère personnel.
      </p>

      <h2>Responsable du traitement</h2>
      <p>
        {s.legal_name}, {s.city}, {s.country}.{" "}
        {contact ? (
          <>
            Contact : <a href={`mailto:${contact}`}>{contact}</a>.
          </>
        ) : (
          <>
            Contact : <Link href="/contact?sujet=donnees-personnelles">formulaire, sujet « Mes données personnelles »</Link>.
          </>
        )}
      </p>

      <h2>Données collectées et usages</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Situation</th>
            <th scope="col">Données</th>
            <th scope="col">Usage</th>
            <th scope="col">Durée de conservation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Demande de devis</td>
            <td>Nom, organisation, e-mail, téléphone (facultatif), description du besoin, budget, échéance</td>
            <td>Répondre à votre demande et préparer une proposition</td>
            <td>24 mois au plus après la demande, sauf si un contrat est signé</td>
          </tr>
          <tr>
            <td>Formulaire de contact</td>
            <td>Nom, e-mail, téléphone (facultatif), message</td>
            <td>Vous répondre</td>
            <td>12 mois</td>
          </tr>
          <tr>
            <td>Lettre d&apos;information (si elle est ouverte)</td>
            <td>Adresse e-mail</td>
            <td>Envoyer la lettre</td>
            <td>Jusqu&apos;à votre désinscription ; 30 jours si l&apos;inscription n&apos;est pas confirmée</td>
          </tr>
          <tr>
            <td>Sécurité du site</td>
            <td>Empreinte chiffrée (non réversible) de l&apos;adresse IP, navigateur, page appelée</td>
            <td>Limiter les abus, détecter les attaques</td>
            <td>12 mois</td>
          </tr>
          <tr>
            <td>Mesure des publicités sponsorisées</td>
            <td>Empreinte chiffrée de l&apos;adresse IP, identifiant de session de 30 minutes</td>
            <td>Compter affichages et clics, écarter les robots et les clics frauduleux</td>
            <td>13 mois</td>
          </tr>
        </tbody>
      </table>
      <p>
        Nous ne stockons jamais votre adresse IP en clair. Nous ne vendons aucune donnée et n&apos;utilisons pas vos
        coordonnées pour de la prospection sans votre accord.
      </p>

      <h2>Base légale</h2>
      <p>
        Votre consentement, donné en cochant la case du formulaire ; pour la sécurité et la mesure anti-fraude, notre intérêt
        légitime à protéger le site et nos annonceurs.
      </p>

      <h2>Destinataires et hébergement</h2>
      <p>
        Les données sont accessibles uniquement aux personnes habilitées d&apos;Africa Média, avec une authentification à
        deux facteurs. Elles sont hébergées par nos prestataires techniques : Supabase (base de données, serveurs situés en
        France) et Vercel (hébergement du site, société établie aux États-Unis). Ces pays ne font pas partie de la CEMAC ni
        de la CEEAC. Ces prestataires appliquent des engagements contractuels de sécurité et de confidentialité ; en nous
        transmettant vos données, vous acceptez ce transfert, que nous limitons au strict nécessaire.
      </p>
      <p>
        Si vous acceptez la publicité Google, Google peut déposer ses propres cookies : voir la{" "}
        <Link href="/cookies">page cookies</Link>.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez demander l&apos;accès à vos données, leur rectification, leur suppression ou vous opposer à leur
        traitement. Écrivez-nous{" "}
        {contact ? <a href={`mailto:${contact}`}>par e-mail</a> : <Link href="/contact?sujet=donnees-personnelles">via le formulaire</Link>}{" "}
        en précisant l&apos;adresse e-mail utilisée. Nous répondons dans un délai d&apos;un mois au plus. Vous pouvez aussi
        saisir l&apos;Agence nationale de sécurité informatique et de certification électronique (ANSICE), autorité de
        protection des données au Tchad.
      </p>

      <h2>Sécurité</h2>
      <p>
        Connexions chiffrées (HTTPS), accès d&apos;administration protégés par double authentification, droits d&apos;accès
        limités en base de données, journal des actions d&apos;administration. Aucun système n&apos;est infaillible : en cas
        d&apos;incident touchant vos données, nous vous en informerons.
      </p>
    </LegalPage>
  );
}
