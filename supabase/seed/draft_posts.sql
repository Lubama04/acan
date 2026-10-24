-- Three DRAFT articles for the owner to review, edit and publish from /admin/journal.
-- Drafts are invisible to the public (RLS: status = 'published' required).
insert into public.posts (slug, title, excerpt, body_md, category, status, author_name) values
(
  'rediger-un-communique-de-presse',
  'Rédiger un communiqué de presse que les journalistes lisent',
  'Un communiqué utile tient en une page, répond aux questions de base dès les premières lignes et donne au journaliste de quoi travailler sans vous rappeler.',
  $md$Un journaliste reçoit chaque jour des dizaines de messages. Il décide en quelques secondes si le vôtre mérite d'être lu. Voici ce qui fait la différence.

## Commencer par l'information

Le premier paragraphe répond à cinq questions : qui, quoi, où, quand, pourquoi. Pas de formule d'introduction, pas de remerciements. Si le journaliste ne lit que ces trois lignes, il doit pouvoir écrire une brève.

> Mauvais début : « C'est avec une immense joie que notre organisation… »
>
> Bon début : « L'association X ouvre le 12 mars à Moundou un centre de formation aux métiers du froid pour 60 jeunes. »

## Une page, pas plus

Titre court, un paragraphe d'information, deux ou trois paragraphes de détails, une citation d'un responsable, puis les contacts. Le reste (historique, liste des partenaires, chiffres détaillés) va dans un dossier de presse joint.

## Des chiffres vérifiables

Un chiffre doit pouvoir être vérifié : sa source, sa date, son périmètre. « Plus de 500 bénéficiaires » sans précision affaiblit le texte. « 512 jeunes formés entre janvier et décembre 2025, selon nos registres » le renforce.

## Une citation qui dit quelque chose

La citation sert à donner un avis, une raison, une émotion. Évitez « Nous sommes fiers de ce partenariat ». Préférez une phrase qu'un journaliste aurait envie de reprendre à l'antenne.

## Penser à la radio

Au Tchad, la radio reste un relais majeur. Relisez votre texte à voix haute : des phrases courtes, des sigles expliqués, des noms propres faciles à prononcer. Indiquez si un porte-parole est disponible pour une interview, et dans quelles langues.

## Les contacts, vraiment joignables

Nom, fonction, téléphone, WhatsApp, e-mail. Un numéro qui ne répond pas le jour de la diffusion annule tout le travail précédent.

## Ce qu'il ne faut pas faire

- Envoyer un PDF de plusieurs mégaoctets : beaucoup de journalistes le lisent sur leur téléphone.
- Promettre une exclusivité à plusieurs médias.
- Relancer dix fois. Une relance, le lendemain, suffit.

Un communiqué ne garantit pas une parution. Il augmente vos chances si l'information est réelle, claire et disponible au bon moment.$md$,
  'conseils', 'draft', 'Africa Média'
),
(
  'photos-de-terrain-consentement',
  'Photos de terrain : recueillir le consentement des personnes photographiées',
  'Une belle photo ne vaut rien si la personne n''a pas accepté d''être photographiée. Méthode simple pour recueillir et conserver le consentement, y compris pour les enfants.',
  $md$Les ONG, les institutions et les entreprises ont besoin d'images de leurs activités. Les personnes photographiées ont, elles, le droit de savoir ce que deviendra leur image et de refuser.

## Expliquer avant de photographier

Avant la prise de vue, dites simplement qui vous êtes, pourquoi vous photographiez et où les images seront publiées (rapport, site, réseaux sociaux). Faites-le dans la langue de la personne, avec un interprète si besoin.

## Garder une trace écrite

Un formulaire d'une page suffit : nom, date, lieu, usages acceptés, signature ou empreinte. Photographiez le formulaire signé à côté de la personne : la trace et l'image restent liées. Conservez ces documents aussi longtemps que les photos sont utilisées.

## Les enfants

Pour un mineur, l'accord d'un parent ou d'un tuteur est nécessaire, en plus de celui de l'enfant. Évitez les images qui permettent de situer précisément le domicile ou l'école d'un enfant.

## Les situations sensibles

Personnes malades, réfugiées, victimes de violences : certaines images ne doivent pas être prises, même avec un accord, parce qu'elles exposent la personne à un risque. Dans le doute, photographiez les mains, le geste, le lieu, plutôt que le visage.

## La dignité avant l'effet

Montrez les personnes actives, dans leur travail, plutôt qu'en position d'attente ou de détresse. Une photo juste respecte la personne et sert mieux votre message.

## Respecter les règles des bailleurs

La plupart des bailleurs et des agences des Nations unies ont leurs propres règles de visibilité et de protection des données. Lisez-les avant la mission : elles précisent souvent les logos à afficher et les images interdites.

Une photothèque bien tenue, avec les autorisations classées, vous évite de devoir retirer des images en urgence.$md$,
  'conseils', 'draft', 'Africa Média'
),
(
  'choisir-ses-reseaux-sociaux-au-tchad',
  'Facebook, TikTok, LinkedIn : choisir ses réseaux sociaux au Tchad',
  'Être partout ne sert à rien si personne ne vous lit. Comment choisir un ou deux réseaux selon vos publics, et tenir un rythme réaliste.',
  $md$Beaucoup d'organisations ouvrent une page sur chaque réseau, publient pendant deux mois, puis s'arrêtent. Une page abandonnée donne une mauvaise image. Mieux vaut un seul réseau bien tenu.

## Partir de vos publics

Posez-vous trois questions : qui voulez-vous toucher, que doivent-ils savoir ou faire, et sur quel écran vous lisent-ils ? Au Tchad, la grande majorité des internautes se connectent depuis un téléphone, souvent avec une connexion limitée : des visuels légers et des textes courts passent mieux.

## Ce que disent les chiffres disponibles

Selon le rapport *Digital 2026: Chad* de DataReportal, le Tchad comptait environ 2,8 millions d'internautes fin 2025, soit autour de 13 % de la population. Facebook et TikTok sont les plateformes les plus utilisées ; une part importante de la population n'est pas en ligne. Pour toucher tout le monde, les réseaux sociaux complètent la radio et le terrain, ils ne les remplacent pas.

## Quel réseau pour quel objectif

- **Facebook** : informer un large public, publier des annonces, répondre aux questions. Utile pour les institutions, les écoles, les services.
- **TikTok** : vidéos courtes, public jeune, ton plus direct. Demande une production régulière.
- **LinkedIn** : partenaires, bailleurs, recrutement, entreprises. Peu de volume, mais des lecteurs ciblés.
- **WhatsApp** (chaîne ou groupes) : diffusion directe, très lue, à réserver à des informations utiles pour ne pas lasser.

## Un rythme tenable

Deux publications de qualité par semaine valent mieux qu'une par jour pendant un mois. Préparez un calendrier mensuel, validé à l'avance, avec des sujets récurrents : une activité, une information pratique, une personne de l'équipe.

## Mesurer simplement

Chaque mois : combien de personnes ont vu vos publications, lesquelles ont suscité des réactions ou des messages, et ce que vous changez le mois suivant. Les chiffres de « J'aime » seuls ne disent pas si votre message est passé.

Source : DataReportal, *Digital 2026: Chad* (datareportal.com/reports/digital-2026-chad).$md$,
  'conseils', 'draft', 'Africa Média'
);
