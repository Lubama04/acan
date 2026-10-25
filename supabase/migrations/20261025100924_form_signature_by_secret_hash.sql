-- The database keeps only the SHA-256 fingerprint of the server's FORM_SIGNING_SECRET.
-- The website server sends the secret in form_sig (server-to-database over TLS, never to browsers);
-- the trigger compares fingerprints, then clears the column. Rotating = new secret on Vercel + new hash here.
create or replace function private.verify_form_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
begin
  select value into v_hash from private.app_secrets where name = 'form_signing_sha256';
  if v_hash is null
     or new.form_sig is null or new.form_ts is null or new.ip_hash is null
     or abs(extract(epoch from now()) - new.form_ts) > 300
     or encode(extensions.digest(new.form_sig, 'sha256'), 'hex') <> v_hash then
    raise exception 'invalid_submission' using errcode = '42501';
  end if;

  new.form_sig := null;
  new.form_ts := null;
  new.id := gen_random_uuid();
  new.created_at := now();
  if tg_table_name = 'newsletter_subscribers' then
    new.status := 'pending';
    new.consent_at := now();
    new.unsubscribe_token := gen_random_uuid();
  else
    new.status := 'new';
    new.updated_at := now();
  end if;
  if tg_table_name = 'leads' then
    new.admin_notes := null;
  end if;
  return new;
end;
$$;
revoke all on function private.verify_form_submission() from public;

-- The fingerprint itself is inserted out of band (not committed):
--   insert into private.app_secrets (name, value)
--   values ('form_signing_sha256', '<sha256 hex of FORM_SIGNING_SECRET>')
--   on conflict (name) do update set value = excluded.value;
