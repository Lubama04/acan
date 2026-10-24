import { LegalPage } from "@/components/content/legal-page";
import { ConsentSettingsButton } from "@/components/consent/consent-settings-button";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Cookies",
  description: "Les cookies utilisés sur le site d'Africa Média et comment gérer votre consentement.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <LegalPage title="Cookies" path="/cookies" updated="24 octobre 2026">
      <p>
        Un cookie est un petit fichier déposé par le site dans votre navigateur. Ce site en utilise très peu,
        et aucun cookie publicitaire sans votre accord.
      </p>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Liste des cookies">
        <table>
          <thead>
            <tr>
              <th scope="col">Cookie</th>
              <th scope="col">Rôle</th>
              <th scope="col">Durée</th>
              <th scope="col">Accord requis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>am_consent</td>
              <td>Mémoriser votre choix sur la publicité</td>
              <td>6 mois</td>
              <td>Non (nécessaire)</td>
            </tr>
            <tr>
              <td>am_ad_sid</td>
              <td>
                Compter une seule fois l&apos;affichage d&apos;une publicité sponsorisée et écarter les clics
                frauduleux. Identifiant aléatoire, sans donnée personnelle.
              </td>
              <td>30 minutes</td>
              <td>Non (mesure et lutte contre la fraude)</td>
            </tr>
            <tr>
              <td>sb-… (Supabase)</td>
              <td>Session des administrateurs du site uniquement</td>
              <td>Durée de la session</td>
              <td>Non (nécessaire)</td>
            </tr>
            <tr>
              <td>Cookies Google (AdSense)</td>
              <td>Afficher des annonces Google, non personnalisées par défaut</td>
              <td>Selon Google</td>
              <td>Oui</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Vous pouvez changer d&apos;avis à tout moment :{" "}
        <ConsentSettingsButton className="link font-semibold" />.
      </p>
    </LegalPage>
  );
}
