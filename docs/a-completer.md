# À compléter par la direction

Tant qu'un élément manque, la section concernée reste masquée ou affiche une mention prudente.
Tout se saisit dans **/admin/parametres** (sauf mention contraire) : aucune modification de code n'est nécessaire.

## 1. Bloquant pour la mise en production

| # | Élément | Où | Effet tant qu'il manque |
| --- | --- | --- | --- |
| 1 | **Clé secrète Supabase** (`SUPABASE_SECRET_KEY`) | Supabase → acan → Project Settings → API Keys → Secret keys, puis Vercel → acan → Settings → Environment Variables (Production + Preview, type *Sensitive*) | Pas de journal de sécurité en base, pas de blocage automatique, pas de comptage des publicités, pas de limitation de débit sur la connexion admin |
| 2 | **E-mail du premier administrateur** | Me le communiquer, ou exécuter le SQL du § 5 | Personne ne peut accéder à /admin |
| 3 | **Nom de domaine** (achat + DNS) | Votre décision ; je ne l'achète pas | Pas d'indexation (le site est en `noindex`), pas d'AdSense, pas d'e-mails professionnels |
| 4 | **Variables de production** : `NEXT_PUBLIC_SITE_URL=https://votre-domaine`, `NEXT_PUBLIC_ALLOW_INDEXING=true` | Vercel → Production uniquement | Le site reste invisible des moteurs de recherche |
| 5 | **Validation juridique** de la politique de confidentialité et des CGU | Juriste au Tchad (loi 007/PR/2015, ANSICE, transferts hors CEMAC/CEEAC) | Textes prudents mais non validés |

## 2. Identité légale (site_settings)

| Élément | Clé | Statut |
| --- | --- | --- |
| Numéro RCCM | `rccm` | Vide → « en cours d'immatriculation » |
| NIF | `nif` | Vide → « en cours d'immatriculation » |
| Capital social | `share_capital` | Vide (non affiché) |
| Adresse du siège | `address` | Vide (seule la ville est affichée) |
| Responsable de la publication | `publication_director` | Vide → « le gérant de la société » |
| Téléphone public | `phone` | Vide (non affiché) |
| E-mail public | `email` | Vide (formulaire de contact proposé à la place) |
| Contact données personnelles | `privacy_contact_email` | Vide (formulaire, sujet « Mes données personnelles ») |
| Contact sécurité | `security_contact_email` | Vide (security.txt pointe vers le formulaire) |
| Liens réseaux sociaux | `social_links` | Vides (non affichés) |

À vérifier : l'adresse de Vercel Inc. affichée dans les mentions légales (« 440 N Barranca Ave #4133, Covina, CA 91723 »)
provient de ses mentions publiques ; confirmez-la sur vercel.com/legal avant la mise en ligne.

## 3. Contenus

| Élément | Où | Effet tant qu'il manque |
| --- | --- | --- |
| **CV et photos des porteurs** (nom, rôle, biographie, expériences, photo avec autorisation) | Table `team_members` (à saisir en SQL ou via une évolution du back-office), puis cocher « Afficher les porteurs » | Section « Équipe » masquée |
| **Études de cas réelles** avec **accord écrit du client** (référence de l'accord obligatoire en base) | Table `case_studies`, puis cocher « Afficher les réalisations » | Page /realisations en 404, absente du menu et du sitemap |
| **Articles du Journal** (au moins 10 à 15 articles originaux avant de demander AdSense) | /admin/journal | Journal vide, pas de publicité affichée |
| **Validation des forfaits** (Présence, Visibilité, Accompagnement) : intitulés et contenus proposés par défaut | Table `packages` | Structure affichée, prix « Sur devis » |
| **Tarifs** si vous souhaitez les publier | `packages.price_label` | « Sur devis » |
| **Photos authentiques** de l'agence et de missions (avec droits et consentements) | Bucket Supabase `media` | Mises en page typographiques, sans photo |
| **Kit média publicitaire** (audience réelle, formats, conditions) | Puis cocher « Kit média disponible » | Mention « en préparation » |
| **Décision : communication politique partisane** | Direction | Le site indique que l'agence n'en fait pas (choix prudent par défaut) |
| **Délai de réponse aux demandes** que vous pouvez tenir | À me communiquer | Aucun délai promis sur le site |
| **Signature de marque** (remplacer « Informer · Connecter · Inspirer », orientée média) | Décision | Le logo n'a pas de signature ; « Agence de communication » est utilisé |

## 4. Services externes à configurer

| Élément | Variable | Effet tant qu'il manque |
| --- | --- | --- |
| Numéro WhatsApp Business | `NEXT_PUBLIC_WHATSAPP_NUMBER` (chiffres seuls, ex. 2356…) | Bouton WhatsApp masqué |
| Identifiant AdSense (après approbation Google) | `NEXT_PUBLIC_ADSENSE_CLIENT_ID` (ca-pub-…) + cocher « Autoriser Google AdSense » + identifiants de blocs dans /admin/publicite | Publicité maison à la place ; ads.txt vide ; bandeau cookies absent |
| Alertes de sécurité par e-mail | `RESEND_API_KEY`, `ALERT_EMAIL_TO`, `ALERT_EMAIL_FROM` (domaine vérifié chez Resend) | Aucune alerte envoyée (les incidents restent visibles dans /admin/securite) |
| Lettre d'information | Service d'e-mail (Resend ou autre) + double confirmation | Formulaire newsletter désactivé |

## 5. Créer le premier administrateur (à faire une fois)

1. Supabase → Authentication → Users → *Add user* → saisir l'e-mail et un mot de passe de 16 caractères ou plus.
2. Supabase → SQL Editor :
   ```sql
   insert into public.admin_allowlist (email) values ('votre-email@domaine');
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'votre-email@domaine';
   ```
3. Se connecter sur /admin/login, puis configurer l'application d'authentification (TOTP) à la première connexion.

## 6. Réglages Supabase Auth à faire dans le tableau de bord (non modifiables par l'outil utilisé)

- Authentication → Sign In / Providers : **désactiver « Allow new users to sign up »**.
- Authentication → Policies : longueur minimale du mot de passe **12** (16 recommandé), exiger chiffres et symboles.
- Authentication → URL Configuration : *Site URL* = domaine de production.
- Authentication → Sessions (si disponible sur le forfait) : délai d'inactivité 1 h pour limiter la durée des sessions admin.
- Authentication → MFA : TOTP activé (activé par défaut).
