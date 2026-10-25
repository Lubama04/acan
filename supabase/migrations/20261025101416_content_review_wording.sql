-- Independent content review (2026-10-25): remove promises the agency cannot guarantee yet,
-- unsourced market claims and clichés. Text updates only.
update public.segments set
  key_message = 'Une communication publique claire, avec un calendrier fixé dès le devis et conforme à vos procédures.',
  approach = 'Nous respectons vos procédures d''achat et vos circuits de validation, et nous vous remettons chaque livrable une fois validé.'
where slug = 'institutions-publiques';

update public.segments set
  key_message = 'Votre événement préparé, couvert et documenté.',
  approach = 'Nous préparons l''événement avec vous, nous le couvrons sur place et nous livrons les contenus dans les délais fixés au devis.'
where slug = 'associations-evenements';

update public.segments set
  needs = array['Présentation de l''activité', 'Kit de présentation', 'Premiers contenus', 'Page professionnelle sur les réseaux'],
  approach = 'Des missions au périmètre clair, avec un délai annoncé avant de commencer.'
where slug = 'entrepreneurs-startups';

update public.segments set
  needs = array['Image de marque', 'Réseaux sociaux et publicité en ligne', 'Lancements de produits et ouvertures', 'Communication de crise']
where slug = 'entreprises';

update public.services set
  body_md = replace(body_md, 'Facebook et TikTok concentrent l''essentiel de l''audience en ligne', 'Facebook et TikTok sont parmi les réseaux les plus utilisés')
where slug = 'gestion-reseaux-sociaux';

update public.services set
  body_md = replace(body_md, 'Une bonne image vaut mieux qu''un long discours, à condition d''être juste.', 'Une photo juste explique souvent mieux qu''un rapport.')
where slug = 'production-photo-video';

update public.services set
  body_md = replace(body_md, 'Les traductions sont confiées à des traducteurs et relues avant publication.', 'Les traductions, si besoin, sont relues avant publication.')
where slug = 'redaction-contenus';
