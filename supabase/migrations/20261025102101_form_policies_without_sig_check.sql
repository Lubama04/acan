-- The BEFORE INSERT trigger verifies the proof and then clears form_sig, so RLS (evaluated after
-- the trigger) must not require form_sig. The proof check lives in private.verify_form_submission().
alter policy leads_insert_public on public.leads
  with check (status = 'new' and admin_notes is null and consent and ip_hash is not null and form_sig is null);
alter policy contact_insert_public on public.contact_messages
  with check (status = 'new' and consent and ip_hash is not null and form_sig is null);
alter policy newsletter_insert_public on public.newsletter_subscribers
  with check (status = 'pending' and ip_hash is not null and form_sig is null);
