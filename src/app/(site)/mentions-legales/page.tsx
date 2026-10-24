import Link from "next/link";
import { LegalPage } from "@/components/content/legal-page";
import { getSettings, isRegistered } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Mentions légales",
  description: "Mentions légales du site d'Africa Média : éditeur, hébergement, propriété intellectuelle.",
  path: "/mentions-legales",
});

export default async function LegalNoticePage() {
  const s = await getSettings();
  return (
    <LegalPage title="Mentions légales" path="/mentions-legales" updated="24 octobre 2026">
      <h2>Éditeur du site</h2>
      <p>
        {s.legal_name}
        {s.legal_form ? `, ${s.legal_form}` : ""}
        {s.share_capital ? ` au capital de ${s.share_capital}` : ""}.
        <br />
        {isRegistered(s) ? (
          <>
            RCCM : {s.rccm} · NIF : {s.nif}
          </>
        ) : (
          <>
            Société {s.registration_status} : les numéros RCCM et NIF seront publiés sur cette page dès leur
            délivrance.
          </>
        )}
        <br />
        Siège : {s.address ? `${s.address}, ` : ""}
        {s.city}, {s.country}.
      </p>
      <p>
        Contact :{" "}
        {s.email ? (
          <a href={`mailto:${s.email}`}>{s.email}</a>
        ) : (
          <Link href="/contact">formulaire de contact</Link>
        )}
        {s.phone ? ` · ${s.phone}` : ""}.
      </p>
      <p>Responsable de la publication : {s.publication_director ?? "le gérant de la société"}.</p>

      <h2>Hébergement</h2>
      <p>
        Site : {s.hosting_provider ?? "Vercel Inc. (États-Unis)"}.
        <br />
        Base de données : {s.database_provider ?? "Supabase Inc., région Union européenne"}.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, le logo et les éléments graphiques de ce site appartiennent à {s.legal_name}, sauf mention
        contraire. Toute reproduction sans autorisation écrite est interdite, à l&apos;exception des courtes
        citations avec mention de la source et lien vers la page.
      </p>

      <h2>Contenus publicitaires</h2>
      <p>
        Les annonces et les contenus financés par un partenaire sont signalés par la mention « Publicité » ou
        « Contenu sponsorisé ». Voir la{" "}
        <Link href="/contenus-sponsorises">politique des contenus sponsorisés</Link>.
      </p>

      <h2>Données personnelles et cookies</h2>
      <p>
        Voir la <Link href="/confidentialite">politique de confidentialité</Link> et la{" "}
        <Link href="/cookies">page cookies</Link>.
      </p>
    </LegalPage>
  );
}
