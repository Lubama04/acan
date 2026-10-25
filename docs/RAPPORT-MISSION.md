# Rapport de mission — site Africa Média (version intermédiaire)

**État : prêt sous conditions, non fusionné.** PR brouillon https://github.com/Lubama04/acan/pull/1, aperçu Vercel
https://acan-q1o42pwk7-flaugust-dev.vercel.app (protégé par SSO Vercel).

## Fait
- Identité : 2 logos SVG, version A retenue, jeu complet de favicons, icônes et image OG (`design/`, `public/`).
- Design system : `design/DESIGN.md`, avec une palette échantillonnée sur les images d'origine et des contrastes vérifiés.
- Segmentation sourcée : `docs/segmentation.md` (16 sources, faits et hypothèses séparés, plan de prospection 90 jours).
- Supabase : 7 migrations, RLS sur toutes les tables, tables SILS, rétention automatique.
  - Advisors : 0 alerte de sécurité.
  - Tests RLS réussis, y compris un test de mutation.
- Site public complet :
  - accueil, agence, 5 services, secteurs, réalisations masquées, journal, devis en 4 étapes, publicité, contact ;
  - 5 pages légales prudentes (« en cours d'immatriculation », pas de mention de la HAMA).
- Publicité :
  - AdSlot (sponsor, puis AdSense après consentement, puis publicité maison) ;
  - anti-fraude côté serveur, `ads.txt` généré depuis la configuration ;
  - Consent Mode v2.
- Back-office `/admin` :
  - accès protégé par MFA, liste blanche et rôles ;
  - demandes, journal, publicité, paramètres, tableau de bord de sécurité.
- Sécurité :
  - CSP à nonce et en-têtes de sécurité ;
  - 2 règles Vercel Firewall publiées ;
  - CI (lint, types, tests, audit, gitleaks, SBOM), CodeQL, Dependabot, scan de secrets et push protection activés.
- Tests :
  - 28 tests unitaires et 64 tests de bout en bout réussis (mobile et ordinateur, axe WCAG 2.2 AA) ;
  - parcours devis vérifié jusqu'en base, puis ma ligne de test supprimée.
- Lighthouse mobile en local :
  - performance 92 à 98 (une mesure isolée à 81 sur `/devis`, retombée à 96–98 sur trois nouveaux passages) ;
  - accessibilité 100, bonnes pratiques 100 ;
  - SEO 100 avec l'indexation activée, 69 sans indexation (volontaire hors production).
- Documentation : `docs/decisions.md`, `docs/a-completer.md`, `docs/architecture.md`, `docs/securite.md`.

## Relecture indépendante (25/10/2026)
- Faite par deux relecteurs distincts (sécurité ; design, accessibilité, SEO, contenu). Détail : `docs/revue-independante.md`.
- Sécurité : aucun défaut critique ; 6 défauts confirmés (1 élevé, 3 moyens, 2 faibles), tous corrigés et testés.
  Le plus grave permettait de bloquer durablement les formulaires par insertion directe via l'API : chaque
  insertion publique exige désormais une preuve serveur vérifiée par la base.
- Contenu : formulations engageantes corrigées (« SARL en cours d'immatriculation », délais, consentement,
  confidentialité, transferts de données) ; accessibilité (focus, menu mobile, aria, RTL, cibles tactiles) ;
  SEO (titres, Journal vide en noindex, image de partage absente : corrigée et vérifiée).
- Après corrections : 34 tests unitaires, 64 tests de bout en bout + 4 scénarios d'écriture en base, tests RLS
  étendus : tous réussis. Mes lignes de test ont été supprimées de la base.

## Non terminé
- Le README n'est pas mis à jour avec les nouvelles variables : voir `docs/architecture.md`.
- Tests SILS n° 3 et 4 non exécutés de bout en bout : il faut la clé service, un compte admin et Resend.

## Ce que vous devez fournir
Voir `docs/a-completer.md` :
- clé secrète Supabase ;
- e-mail de l'administrateur ;
- domaine ;
- RCCM et NIF ;
- téléphone, e-mail et WhatsApp ;
- CV des porteurs ;
- études de cas avec accord écrit des clients ;
- validation des forfaits ;
- identifiant AdSense (après approbation) ;
- validation juridique.

## Prérequis AdSense (approbation non garantie)
- un domaine propre ;
- au moins 10 à 15 articles originaux publiés : 3 brouillons sont prêts ;
- des pages légales accessibles ;
- une navigation claire.

## 10 prochaines actions
1. Ajouter `SUPABASE_SECRET_KEY` sur Vercel.
2. Créer le compte admin et activer la MFA.
3. Relire puis publier les 3 brouillons du journal.
4. Désactiver l'inscription publique dans Supabase Auth et fixer 12 caractères minimum.
5. Renseigner le responsable de la publication et faire vérifier la question ANSICE (transferts hors CEMAC/CEEAC).
6. Acheter le domaine, puis le relier à Vercel.
7. Activer l'indexation en production et déclarer le site dans Search Console et Bing Webmaster.
8. Saisir RCCM et NIF dès réception.
9. Configurer Resend pour les alertes.
10. Faire valider juridiquement les textes, passer le dépôt en privé, puis fusionner après votre accord.
