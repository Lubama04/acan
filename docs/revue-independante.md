# Relecture indépendante — 25 octobre 2026

Deux relectures menées par des agents distincts de celui qui a produit le code, en lecture seule :
(1) sécurité, (2) design, accessibilité, SEO et contenu. Chaque constat a été vérifié dans le code avant
correction. Statut : **Corrigé**, **Partiel**, **Non retenu** (avec raison) ou **À décider** (par vous).

## 1. Sécurité

Aucun défaut critique. Autorisation, RLS, gestion des secrets, rendu Markdown, JSON-LD, CSP et absence de
redirection ouverte jugés corrects.

| # | Gravité | Constat | Statut | Correction |
| --- | --- | --- | --- | --- |
| 1 | Élevée | Insertion directe via l'API (clé publique) : `created_at` et `ip_hash` forgeables → déni de service durable des formulaires, contournement du throttle, du honeypot et de Zod | **Corrigé** | Toute insertion anonyme doit porter une preuve serveur (secret `FORM_SIGNING_SECRET`, la base n'en garde que l'empreinte SHA-256) ; un trigger force `id`, `created_at`, `status`, `updated_at`, `admin_notes`, jeton de désinscription. Tests RLS : preuve absente ou fausse → refus ; date forgée → écrasée |
| 2 | Moyenne | Énumération des abonnés à la lettre (409 sur doublon via l'API) | **Corrigé** | Même mécanisme : sans preuve, refus avant la contrainte d'unicité |
| 3 | Moyenne | Impressions gonflables sans limite, clics « fermés » depuis un autre site, table inondable | **Corrigé** | Jeton HMAC lié à la campagne émis au rendu (30 min) exigé sur les deux routes ; clic compté seulement si `Sec-Fetch-Site: same-origin` ; plafond d'impressions par IP (60/h) ; au-delà de 300 requêtes/h/IP, plus rien n'est stocké ; nouveau motif `invalid_token` |
| 4 | Moyenne | `max_impressions` jamais appliqué | **Corrigé** | Campagnes plafonnées exclues de l'affichage et du comptage (nécessite la clé service, comme le comptage) |
| 5 | Faible | Limite de connexion « ouverte » en cas d'erreur, pas de limite MFA | **Corrigé** | Échec fermé en production si le compteur répond en erreur ; limite MFA 10/15 min/IP ; règle de détection `mfa_failures` |
| 6 | Faible | Injection de paramètres dans les liens `mailto:` de l'admin | **Corrigé** | Contrainte e-mail durcie en base (`? & % / < > "` refusés) + adresse encodée dans le lien |
| H1 | — | Règle « injection » bloquant une IP au premier signalement (faux positifs derrière NAT mobile) | **Corrigé** | Seuil 3 en 10 min, sans blocage automatique |
| H2 | — | Inscription publique Supabase Auth ouverte, confirmation e-mail désactivée | **Partiel** | Corrigé dans `supabase/config.toml` (local) ; **en production, à faire dans le tableau de bord** (a-completer § 6) |
| H3 | — | Temps de remplissage fixé par le client | **Corrigé** | Heure de rendu signée par le serveur (jeton HMAC) |
| H4 | — | Liens protocole-relatifs (`//site`) acceptés dans le Markdown | **Corrigé** | Expression régulière resserrée |
| H5 | — | Campagne expirée encore comptée jusqu'à 60 s (cache) | **Corrigé** | Dates et plafond revérifiés dans les routes |

## 2. Design, accessibilité, SEO, contenu

Aucune règle absolue enfreinte (pas de « News », pas de HAMA, pas de faux clients ou chiffres, « Sur devis »,
contenus sponsorisés étiquetés, jamais « immatriculée »).

### Formulations engageantes ou juridiquement risquées — **corrigées**

- « SARL » seul → « SARL en cours d'immatriculation » tant que RCCM et NIF sont vides (pied de page, mentions,
  agence).
- Responsable de la publication : « le gérant » → « le promoteur du projet (nom publié prochainement) ».
  **À fournir avant l'indexation.**
- Promesses de délais (« livrée dans les délais », « rapidement », « de bout en bout ») remplacées par des
  formulations liées au devis.
- Consentement : « consentement écrit » absolu → accord pour les gros plans, autorisation écrite pour les
  témoignages et les mineurs (avec un parent) ; texte de valeurs au futur et non au passé.
- Confidentialité : « restent confidentiels » → « traités de façon confidentielle ; accord de confidentialité
  possible ».
- Affirmation non sourcée sur Facebook/TikTok nuancée ; engagement « traducteurs » et « identité visuelle »
  retirés ; source de l'article brouillon transformée en lien, avec mention « chiffres à vérifier ».
- Politique de confidentialité : « jamais en clair » → « pas en clair dans notre base » ; suppression du
  consentement groupé au transfert. **À décider : autorisation ANSICE éventuelle pour les transferts hors
  CEMAC/CEEAC (juriste).**
- Cookies, CGU, contenus sponsorisés : formulations moins absolues.

### Rédaction — **corrigée**
« On se parle » → « Premier échange » ; titre de la page Agence sans slogan ; libellé « Adresse » ; message de
contact moins technique ; « publicité digitale » → « publicité en ligne » ; cliché « une bonne image vaut mieux
qu'un long discours » remplacé ; guillemets retirés des messages de secteur (ils pouvaient passer pour des
témoignages).

### Accessibilité et RTL — **corrigés**
- Anneau de focus : or `#C48C1E` (2,95:1) → or foncé `#8A5F0F` (5,64:1) sur fond clair, or clair sur fond navy.
- Menu mobile refermé après navigation ; page courante signalée (`aria-current`).
- Champs obligatoires annoncés (`aria-required`), compteur d'étapes annoncé (`aria-live`).
- Cibles tactiles de 44 px (pied de page, fil d'Ariane, navigation).
- `text-left` → `text-start`, flèche retournée en RTL, « À droite » → « À côté ».
- Marge basse du pied de page sur mobile pour ne pas masquer de liens sous le bouton WhatsApp.

### SEO — **corrigé**
Titres Agence et Contact enrichis (N'Djamena) ; chapeau de l'accueil avec « production photo et vidéo » et
« relations presse » ; Journal vide en `noindex` et retiré du sitemap. `og:image` vérifiée dans le HTML produit
(voir rapport de mission).

### Non retenu
- `lastModified` sur les pages statiques du sitemap : sans date de modification fiable, mieux vaut ne rien
  déclarer.
