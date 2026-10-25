-- Decide on the JWT role only (PostgREST always connects as "authenticator", so session_user
-- cannot distinguish anon from service_role). Requests without JWT claims are direct database
-- connections (owner/migrations), which are trusted. Server-controlled columns are always forced.
create or replace function private.verify_form_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_caller text := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
begin
  if v_caller is distinct from 'service_role' and v_caller is not null then
    select value into v_hash from private.app_secrets where name = 'form_signing_sha256';
    if v_hash is null
       or new.form_sig is null or new.form_ts is null or new.ip_hash is null
       or abs(extract(epoch from now()) - new.form_ts) > 300
       or encode(extensions.digest(new.form_sig, 'sha256'), 'hex') <> v_hash then
      raise exception 'invalid_submission' using errcode = '42501';
    end if;
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
