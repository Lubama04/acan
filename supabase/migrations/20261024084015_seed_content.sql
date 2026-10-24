-- Initial content. Only facts given by the owner or neutral descriptions of the offer.
-- Legal identifiers and contact details stay NULL until the owner provides them.

insert into public.site_settings (key, value, is_public, description) values
  ('legal_name', '"Agence de Communication Africa Média"', true, 'Dénomination sociale'),
  ('brand_name', '"Africa Média"', true, 'Nom commercial'),
  ('legal_form', '"SARL"', true, 'Forme juridique'),
  ('registration_status', '"en cours d''immatriculation"', true, 'Affiché tant que RCCM/NIF sont vides'),
  ('rccm', 'null', true, 'Numéro RCCM (à fournir)'),
  ('nif', 'null', true, 'Numéro d''identification fiscale (à fournir)'),
  ('share_capital', 'null', true, 'Capital social (à fournir)'),
  ('address', 'null', true, 'Adresse du siège (à fournir)'),
  ('city', '"N''Djamena"', true, 'Ville'),
  ('country', '"Tchad"', true, 'Pays'),
  ('phone', 'null', true, 'Téléphone public (à fournir)'),
  ('email', 'null', true, 'Email public (à fournir)'),
  ('publication_director', 'null', true, 'Directeur de la publication (à fournir)'),
  ('privacy_contact_email', 'null', true, 'Contact données personnelles (à fournir)'),
  ('security_contact_email', 'null', true, 'Contact signalement sécurité (security.txt, à fournir)'),
  ('hosting_provider', '"Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis"', true, 'Hébergeur du site'),
  ('database_provider', '"Supabase Inc. — données hébergées dans la région AWS eu-west-3 (Paris, France)"', true, 'Hébergeur des données'),
  ('social_links', '{}', true, 'Liens réseaux sociaux {facebook, linkedin, tiktok, instagram}'),
  ('feature_team', 'false', true, 'Afficher les porteurs (CV requis)'),
  ('feature_case_studies', 'false', true, 'Afficher les réalisations (cas réels avec accord client)'),
  ('feature_newsletter', 'false', true, 'Formulaire newsletter (nécessite un service d''email)'),
  ('feature_media_kit', 'false', true, 'Kit média publicitaire téléchargeable'),
  ('adsense_enabled', 'false', true, 'Active AdSense si l''identifiant est configuré'),
  ('adsense_publisher_id', 'null', false, 'pub-XXXXXXXXXXXXXXXX pour ads.txt (à fournir)');

insert into public.services (slug, title, summary, body_md, deliverables, process, position, published) values
(
  'communication-institutionnelle',
  'Communication institutionnelle',
  'Faire comprendre votre mission, vos décisions et vos résultats à vos publics : citoyens, partenaires, bailleurs, équipes.',
  'Une institution, une ONG ou une entreprise doit expliquer ce qu''elle fait, souvent à des publics très différents. Nous construisons avec vous des messages clairs, un ton cohérent et des supports adaptés au terrain tchadien : documents imprimables, contenus pour les réseaux, messages pour la radio.',
  array['Plan de communication annuel ou par projet', 'Charte éditoriale et éléments de langage', 'Plaquettes, fiches projet et rapports d''activité mis en page', 'Supports de sensibilisation adaptés aux publics locaux', 'Respect des chartes de visibilité des bailleurs'],
  array['Entretien de cadrage et lecture de vos documents', 'Proposition écrite : objectifs, publics, messages, calendrier', 'Production et validation des supports', 'Bilan et recommandations'],
  1, true
),
(
  'gestion-reseaux-sociaux',
  'Gestion des réseaux sociaux',
  'Une présence régulière et professionnelle sur Facebook, TikTok, LinkedIn ou Instagram, avec un rapport chaque mois.',
  'Au Tchad, Facebook et TikTok concentrent l''essentiel de l''audience en ligne. Publier au hasard ne suffit pas : il faut un calendrier, des contenus pensés pour le mobile et une modération suivie. Nous prenons en charge vos pages ou nous formons votre équipe.',
  array['Audit de vos pages existantes', 'Calendrier éditorial mensuel', 'Création et publication des contenus', 'Modération et réponses aux messages selon des règles convenues', 'Rapport mensuel : publications, audience, enseignements'],
  array['Audit et définition de la ligne éditoriale', 'Validation du calendrier du mois', 'Publication et modération', 'Rapport et ajustements'],
  2, true
),
(
  'production-photo-video',
  'Production photo et vidéo',
  'Reportages, portraits, couverture d''événements et vidéos courtes, réalisés avec le consentement des personnes filmées.',
  'Une bonne image vaut mieux qu''un long discours, à condition d''être juste. Nous couvrons vos activités à N''Djamena et en province, en recueillant le consentement des personnes photographiées et en respectant leur dignité. Les fichiers sont livrés optimisés pour le web et en haute définition pour l''impression.',
  array['Couverture photo d''événements et d''activités terrain', 'Portraits et photos institutionnelles', 'Vidéos courtes pour les réseaux sociaux', 'Témoignages filmés avec autorisation écrite', 'Photothèque classée et légendée'],
  array['Repérage et plan de tournage', 'Collecte des autorisations', 'Prise de vue', 'Montage, validation et livraison'],
  3, true
),
(
  'redaction-contenus',
  'Rédaction de contenus',
  'Articles, communiqués, rapports, discours et textes de site, en français, et selon le projet en arabe ou en anglais.',
  'Écrire simplement prend du temps. Nous rédigeons vos textes à partir de vos informations, nous les faisons valider et nous adaptons le niveau de langue à chaque public. Les traductions sont confiées à des traducteurs et relues avant publication.',
  array['Articles et actualités pour votre site', 'Communiqués et dossiers de presse', 'Rapports d''activité et fiches de capitalisation', 'Discours et notes de synthèse', 'Textes de site web et de plaquettes'],
  array['Recueil des informations et des sources', 'Plan et premier jet', 'Relecture et corrections avec vous', 'Version finale et mise en forme'],
  4, true
),
(
  'relations-presse',
  'Relations presse',
  'Préparer et diffuser vos informations auprès des journalistes, organiser vos conférences de presse et suivre les retombées.',
  'Les médias tchadiens (presse écrite, radios, télévisions, sites d''information) restent un relais essentiel. Nous préparons des informations utiles aux journalistes, nous organisons les rencontres et nous suivons les retombées. Nous ne payons pas d''articles et nous ne promettons pas de parution.',
  array['Communiqués et dossiers de presse', 'Organisation de conférences et points presse', 'Préparation des porte-parole', 'Revue des retombées'],
  array['Définition du message et des médias visés', 'Préparation des supports', 'Diffusion et relances', 'Suivi des retombées et bilan'],
  5, true
);

insert into public.packages (slug, name, audience, includes, price_label, position, published) values
(
  'presence',
  'Présence',
  'Entrepreneurs, associations et petites structures qui démarrent sur les réseaux.',
  array['Un réseau social au choix', 'Calendrier éditorial mensuel', 'Création et publication des contenus du calendrier', 'Rapport mensuel simplifié'],
  'Sur devis', 1, true
),
(
  'visibilite',
  'Visibilité',
  'PME, établissements scolaires et de santé, ONG qui veulent une présence régulière.',
  array['Jusqu''à deux réseaux sociaux', 'Calendrier éditorial mensuel', 'Création, publication et modération', 'Une séance photo par trimestre', 'Rapport mensuel détaillé'],
  'Sur devis', 2, true
),
(
  'accompagnement',
  'Accompagnement',
  'Institutions, ONG et entreprises qui ont besoin d''un appui de communication continu.',
  array['Réseaux sociaux selon vos besoins', 'Rédaction d''articles et de communiqués', 'Couverture photo et vidéo planifiée', 'Relations presse ponctuelles', 'Point mensuel et rapport'],
  'Sur devis', 3, true
);

insert into public.segments (slug, title, summary, needs, approach, key_message, position, published) values
(
  'institutions-publiques', 'Institutions publiques et collectivités',
  'Ministères, provinces, communes et établissements publics qui doivent informer les citoyens et rendre compte.',
  array['Campagnes de sensibilisation', 'Couverture d''événements officiels', 'Rapports et supports institutionnels', 'Gestion des pages officielles'],
  'Nous respectons vos procédures d''achat et vos circuits de validation. Chaque livrable est daté, validé et archivé.',
  'Une communication publique claire, livrée dans les délais et conforme à vos procédures.', 1, true
),
(
  'ong-developpement', 'ONG, agences des Nations unies et projets de développement',
  'Organisations qui doivent montrer leurs résultats à leurs bailleurs et aux populations, avec rigueur et dignité.',
  array['Visibilité conforme aux chartes des bailleurs', 'Histoires d''impact et témoignages', 'Photo et vidéo terrain', 'Rapports et fiches projet'],
  'Nous recueillons le consentement des personnes, nous respectons les chartes graphiques de vos partenaires et nous travaillons avec vos contraintes de sécurité.',
  'Montrer vos résultats avec dignité et rigueur, dans les règles de vos bailleurs.', 2, true
),
(
  'entreprises', 'Entreprises',
  'PME, banques, télécoms, énergie, commerce, BTP et agro-industrie qui veulent une image claire et une présence régulière.',
  array['Image de marque', 'Réseaux sociaux et publicité digitale', 'Lancements de produits et ouvertures', 'Communication de crise'],
  'Un interlocuteur unique, un calendrier mensuel et un rapport qui dit ce qui a marché et ce qui n''a pas marché.',
  'Une présence régulière et professionnelle, mesurée chaque mois.', 3, true
),
(
  'education-sante-culte', 'Éducation, santé et institutions religieuses',
  'Écoles, universités, cliniques, centres de santé et institutions confessionnelles proches de leurs publics.',
  array['Rentrée et inscriptions', 'Promotion des services', 'Événements et célébrations', 'Communication de proximité'],
  'Des messages simples, au bon moment de l''année, sur les canaux que vos publics utilisent vraiment : radio, affiches, réseaux sociaux.',
  'Faire connaître vos services aux familles, au bon moment.', 4, true
),
(
  'entrepreneurs-startups', 'Entrepreneurs, startups et porteurs de projets',
  'Créateurs d''entreprise qui ont besoin d''une image sérieuse pour leurs premiers clients et partenaires.',
  array['Identité visuelle', 'Kit de présentation', 'Premiers contenus', 'Page professionnelle sur les réseaux'],
  'Des packs au périmètre clair, avec un délai annoncé avant de commencer.',
  'Une image sérieuse dès le premier rendez-vous.', 5, true
),
(
  'associations-evenements', 'Associations, organisations professionnelles et événements',
  'Associations, ordres et organisateurs de salons, forums et conférences.',
  array['Couverture d''événements', 'Communiqués et relations presse', 'Contenus avant, pendant et après', 'Photothèque de l''événement'],
  'Nous préparons l''événement avec vous, nous le couvrons sur place et nous livrons les contenus rapidement.',
  'Votre événement couvert de bout en bout.', 6, true
);

insert into public.ad_slots (key, label, width, height, enabled) values
  ('header', 'Bandeau haut', 728, 90, true),
  ('in_article', 'Dans l''article', 300, 250, true),
  ('sidebar', 'Barre latérale', 300, 600, true),
  ('footer', 'Pied de page', 728, 90, true);
