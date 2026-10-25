# Rapport de sécurité — méthode SILS

Projet : site de l'Agence de Communication Africa Média · branche `feat/v1` · 24 octobre 2026.
Principe appliqué : **réponse défensive uniquement**, blocages temporaires et réversibles, aucune action sur un
système tiers, toute action irréversible soumise à validation humaine.

Légende des statuts : **Réussi** (exécuté, preuve citée) · **Échoué** · **Non exécuté** (avec raison) ·
**Non vérifiable** (hors de portée des outils disponibles).

## 1. Découverte (surface d'attaque)

| Surface | Exposition | Protection |
| --- | --- | --- |
| Pages publiques (`/`, services, journal…) | Lecture | CSP à nonce, en-têtes, RLS lecture du publié |
| Formulaires devis / contact / newsletter (server actions POST) | Écriture anonyme | Zod strict, honeypot, temps minimal, détection d'injection, trigger par IP (5 / 10 min) et global (60 / 10 min), règle Vercel 10 POST/min/IP |
| API Supabase (clé publique) | Lecture/écriture selon RLS | RLS sur 100 % des tables, insert anonyme limité aux 3 tables de formulaires |
| `/api/ads/impression`, `/api/ads/click/:id` | Anonyme | Contrôle d'origine, campagne active uniquement, destination lue en base (pas de redirection ouverte), filtres robots/session/IP |
| `/admin/**` | Authentifié | Session validée (`getUser`), MFA TOTP (aal2), rôle + liste blanche, revérification dans chaque page/action/route, RLS identique en base |
| `ads.txt`, `security.txt`, `robots.txt`, `sitemap.xml` | Lecture | Générés depuis la configuration |
| Chemins sondés (`.env`, `.git`, WordPress…) | — | 404 dans `proxy.ts` + règle Vercel `am-block-probe-paths` (deny) |

## 2. Audit — phase 1 (prévention)

| Exigence SILS | Mise en œuvre | Statut |
| --- | --- | --- |
| RLS sur toutes les tables, politiques explicites, pas de `USING (true)` sensible, `WITH CHECK` sur chaque UPDATE | Migrations `supabase/migrations/*` ; seule exception `ad_slots` en lecture publique (géométrie des emplacements, sans donnée personnelle, justifiée en commentaire) | **Réussi** — `rls.test.sql` vérifie 0 table sans RLS et 0 politique UPDATE sans WITH CHECK |
| Clé service uniquement côté serveur | `src/lib/supabase/admin.ts` (`server-only`), aucune variable `NEXT_PUBLIC_*SECRET*` | **Réussi** — scan des fichiers suivis et de l'historique Git : 0 occurrence |
| Validation serveur, contraintes CHECK, champs inconnus rejetés | Zod `.strict()` + CHECK en base (longueurs, énumérations, formats) | **Réussi** — 9 tests Vitest (`forms.test.ts`), dont l'injection de champs `status`/`admin_notes` |
| Auth : vérification e-mail, 12 caractères, messages génériques, déconnexion qui invalide | Messages génériques ; `minLength 12` côté formulaire ; `signOut({scope:"global"})` | **Partiel** — longueur minimale et désactivation des inscriptions à régler dans le tableau de bord Supabase (non modifiable avec les outils disponibles) |
| Rôles séparés, `has_role()` SECURITY DEFINER avec search_path fixé | `user_roles` + `admin_allowlist` ; `private.has_role/is_admin/is_editor` | **Réussi** |
| En-têtes CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS | `proxy.ts` + `next.config.ts` | **Réussi** — test e2e « nonce CSP and hardening headers » + vérification navigateur (aucune violation CSP) |
| CORS liste blanche | Pas d'API cross-origin : routes en même origine, contrôle `Origin` sur `/api/ads/impression` | **Réussi** — test e2e « rejects cross-origin posts » (403) |
| Uploads : magic bytes, taille, UUID, bucket privé | Bucket `media` **public en lecture** (images du site), 5 Mo, types image uniquement, écriture réservée aux éditeurs MFA, pas d'énumération (aucune politique SELECT) | **Partiel** — pas d'upload depuis le site public ; l'upload admin passe par le tableau de bord Supabase (pas de contrôle magic bytes applicatif) |
| Erreurs génériques, pas de log sensible | Messages génériques ; logs = codes d'erreur uniquement | **Réussi** (revue de code) |

## 3. Détection — phase 2

`security_events` (immuable : aucune politique UPDATE/DELETE ; lecture admin ; insertion service role) alimentée par
`logSecurityEvent()` : échecs/réussites de connexion, échecs MFA, refus d'accès admin, limites atteintes, payloads
suspects (SQLi, XSS, traversée, injection de gabarit), honeypot, fraude publicitaire, actions admin (journal
`admin_audit_log` par trigger).
Écart : l'adresse IP est stockée **hachée** (HMAC-SHA256 salé), jamais en clair (décision D8).

**Statut : Partiel.** Le code est en place ; l'écriture en base exige `SUPABASE_SECRET_KEY` (non configurée).
En attendant, les événements vont dans les journaux Vercel, sans donnée personnelle (constaté pendant les tests e2e :
`[security-event] {"type":"honeypot_triggered","severity":"low","endpoint":"form:contact"}`).

## 4. Qualification — phase 3

Table `detection_rules` (5 règles actives issues du cahier des charges) : 5 échecs/10 min → medium ;
20 → high ; motif d'injection → high ; 10 limites atteintes/10 min → medium ; 10 clics suspects/h → medium.
Chaque incident reçoit sévérité, actif, vecteur, confiance et la mention « attribution incertaine ».
**Statut : Non exécuté de bout en bout** (dépend de la clé service). Le code (`src/lib/security/events.ts`) est relu
mais n'a pas de test automatisé d'intégration.

## 5. Confinement — phase 4

`blocked_entities` (expiration obligatoire, contrainte ≤ 7 jours, levée par un admin, auditée). Les triggers de
formulaire refusent une IP bloquée. Limitation de débit : triggers en base + règle Vercel Firewall + compteur
`consume_rate_limit` (service role) pour la connexion admin. Aucune action hors de l'application.
Verrouillage de compte et révocation des sessions sur incident critique : **non implémentés** (le blocage par IP et
la MFA couvrent le risque principal ; à ajouter si un incident le justifie).

## 6. Notification — phase 5

E-mail via Resend pour les incidents high/critical, regroupement 15 minutes, aucune donnée personnelle ni secret
dans le message. **Statut : Non exécuté** — `RESEND_API_KEY` et `ALERT_EMAIL_TO` non fournis. Alerte temps réel
dans le tableau de bord remplacée par un rafraîchissement de page (décision D17).
**Aucune surveillance continue n'est assurée** : les alertes dépendent de cette configuration.

## 7. Investigation et remédiation — phase 6

Fiches incidents (`incidents`) avec chronologie, preuves, cause, impact, correction proposée/appliquée ; validation
humaine explicite (case « Je valide la correction ») ; export JSON pour transmission à une autorité ; jamais de riposte.
**Statut : Réussi (code et RLS)**, non exercé sur un incident réel.

## 8. Apprentissage — phase 7

À la clôture, l'incident alimente `security_memory` et une règle est **proposée désactivée** (`proposed_by=system`) ;
la politique RLS interdit d'insérer une règle active. Activation = action admin explicite.

## 9. Tableau de bord — phase 8

`/admin/securite` (admin + MFA, vérifié côté serveur) : score indicatif avec niveau de certitude par critère, risques
résiduels, incidents par sévérité, événements, blocages avec bouton de levée, règles, mémoire.

## 10. Veille — phase 9

Workflow GitHub hebdomadaire (`weekly-audit.yml`) qui ouvre une issue en cas de CVE high/critical ; Dependabot
(alertes + correctifs automatiques activés) ; CodeQL ; gitleaks ; SBOM CycloneDX ; `npm audit --omit=dev
--audit-level=critical` bloquant en CI. État au 24/10/2026 : **0 vulnérabilité** (production et développement).
Écart : veille par GitHub Actions et non par Edge Function (décision D6).

## 11. Tests obligatoires SILS

| # | Test | Statut | Preuve |
| --- | --- | --- | --- |
| 1 | Un utilisateur ne lit pas les données d'un autre | **Réussi** (adapté : pas de données par utilisateur ; un compte sans rôle ne lit ni demandes, ni journal, ni brouillons) | `rls.test.sql`, bloc « Signed-in user without role » |
| 2 | Un non-authentifié n'accède à rien de protégé | **Réussi** | `rls.test.sql` bloc anonyme ; e2e « admin area redirects anonymous visitors to login » |
| 3 | 6 échecs de connexion → événement medium, limite, e-mail | **Non exécuté** | Nécessite la clé service, Resend et un compte admin ; à exécuter après configuration (procédure § 13) |
| 4 | Non-admin → 403 sur /admin/securite | **Partiel** | `requireAdmin("admin")` appelle `forbidden()` (revue de code) ; en base, admin sans liste blanche ou sans MFA → 0 ligne (`rls.test.sql`). Pas de test e2e avec un compte réel |
| 5 | Aucune table sans RLS | **Réussi** | Requête `pg_tables … rowsecurity=false` = 0 ligne (dans `rls.test.sql`) ; advisors Supabase : 0 alerte sécurité (1 info voulue : `rate_limits` sans politique) |
| 6 | Aucun secret dans le code ni les logs | **Réussi** (code et historique Git) / **Non vérifiable** (logs Vercel de production futurs) | Scan local ; push protection et secret scanning GitHub activés ; gitleaks en CI |

Tests de mutation : une politique `USING (true)` ajoutée sur `leads` est **détectée** par le test anonyme (exécuté
dans une transaction annulée ; aucune trace en base vérifiée ensuite).

## 12. Sauvegardes et restauration

- Organisation Supabase sur un forfait payant (constaté : projet facturé 10 $/mois). Selon la documentation
  Supabase, les forfaits payants incluent des sauvegardes quotidiennes avec rétention limitée ; **la rétention
  réelle et l'absence de PITR n'ont pas pu être vérifiées** avec les outils disponibles. Le PITR n'est pas activé
  (option payante, non activée sans votre accord).
- Les migrations versionnées permettent de recréer le schéma ; le contenu (services, secteurs, forfaits) est dans la
  migration `seed_content`.
- **Restauration** : Supabase → Database → Backups → choisir la sauvegarde → *Restore* (écrase la base : à décider par
  vous). Avant toute restauration : exporter les demandes récentes (`leads`, `contact_messages`) depuis le SQL editor.
  Recommandation : un export mensuel chiffré (`pg_dump`) stocké hors de Supabase.

## 13. Après configuration de la clé service : vérifications à faire

1. Créer l'admin (docs/a-completer.md § 5), se connecter, configurer la MFA.
2. Depuis une autre connexion, faire 6 tentatives de connexion erronées → vérifier dans /admin/securite : 6 événements
   `login_failed`, un incident medium, un blocage de 15 min levable ; si Resend est configuré, aucun e-mail (medium) ;
   à 20 échecs : incident high + e-mail.
3. Lever le blocage depuis le tableau de bord ; vérifier l'entrée dans `admin_audit_log`.

## 14. Règles Vercel Firewall (publiées en production le 24/10/2026)

| Règle | Effet | Retour arrière |
| --- | --- | --- |
| `am-rate-limit-forms` | POST `/devis`, `/contact`, `/admin/login`, `/admin/mfa` : 10 / 60 s / IP, puis refus | `vercel firewall rules disable am-rate-limit-forms` puis `vercel firewall publish` |
| `am-block-probe-paths` | Refus de `.env`, `.git`, `wp-admin`, `wp-login.php`, `xmlrpc.php`, `phpmyadmin`, `server-status` | `vercel firewall rules disable am-block-probe-paths` puis `vercel firewall publish` |

Le forfait Hobby n'inclut pas la protection anti-bot managée ni les ensembles OWASP gérés : non activés.

## 15. Relecture indépendante (25/10/2026)

Six défauts confirmés (1 élevé, 3 moyens, 2 faibles) et cinq durcissements : tous corrigés, sauf la
désactivation de l'inscription publique en production (tableau de bord Supabase, à faire). Détail et preuves :
`docs/revue-independante.md`.

## 16. Risques résiduels

| Risque | Gravité | Mesure recommandée |
| --- | --- | --- |
| Journal, détection et comptage publicitaire inactifs sans `SUPABASE_SECRET_KEY` | Élevée | Ajouter la clé (a-completer § 1) |
| Pas d'alerte e-mail (Resend non configuré) | Moyenne | Configurer Resend avec un domaine vérifié |
| Inscription Supabase Auth ouverte par défaut (un inscrit n'a aucun droit, mais peut créer des comptes) | Faible | Désactiver l'inscription publique |
| Transferts de données hors CEMAC/CEEAC (Vercel, Supabase) | Juridique | Validation par un juriste ; mention déjà présente dans la politique |
| Pas de WAF managé ni d'anti-bot (forfait Hobby) | Moyenne | Passer en Pro ou ajouter Cloudflare devant le domaine |
| Insertions anonymes directes via l'API | **Corrigé le 25/10** | Preuve serveur exigée par la base (décision D19, docs/revue-independante.md) |
| Pas de verrouillage de compte ni de révocation automatique des sessions | Faible | À ajouter si un incident le justifie |
| Dépôt GitHub public (document de segmentation visible) | Faible (stratégique) | Passer le dépôt en privé |
