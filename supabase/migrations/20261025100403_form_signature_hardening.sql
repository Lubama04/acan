-- Independent security review fixes (2026-10-25).
-- 1. Direct inserts through the Data API (publishable key) could forge created_at / ip_hash to DoS
--    or bypass the form throttle, and enumerate newsletter e-mails. Every public insert must now carry
--    an HMAC computed by the website server with a secret shared only with the database
--    (private.app_secrets, never in Git). Server-controlled columns are forced by a trigger.
-- 2. E-mail CHECKs reject characters usable for mailto: header injection (? & % / < > ").
-- 3. Rate-limit buckets for MFA and ad impressions; detection rule for MFA failures;
--    injection rule no longer auto-blocks on a single hit (false positives behind shared NAT).

create table if not exists private.app_secrets (
  name text primary key,
  value text not null check (char_length(value) >= 32)
);
alter table private.app_secrets enable row level security;
revoke all on private.app_secrets from public, anon, authenticated;

alter table public.leads add column if not exists form_ts bigint, add column if not exists form_sig text;
alter table public.contact_messages add column if not exists form_ts bigint, add column if not exists form_sig text;
alter table public.newsletter_subscribers add column if not exists form_ts bigint, add column if not exists form_sig text;
comment on column public.leads.form_sig is 'Transient: HMAC proving the row came through the website; cleared by trigger.';

create or replace function private.verify_form_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
  v_expected text;
begin
  select value into v_secret from private.app_secrets where name = 'form_signing';
  if v_secret is null
     or new.form_sig is null or new.form_ts is null or new.ip_hash is null
     or abs(extract(epoch from now()) - new.form_ts) > 300 then
    raise exception 'invalid_submission' using errcode = '42501';
  end if;
  v_expected := encode(
    extensions.hmac(tg_table_name || ':' || new.ip_hash || ':' || new.form_ts::text, v_secret, 'sha256'),
    'hex');
  if v_expected <> new.form_sig then
    raise exception 'invalid_submission' using errcode = '42501';
  end if;

  -- Server-controlled values, whatever the client sent.
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

-- "0_" prefix: runs before the throttle triggers (triggers fire in name order).
create trigger leads_0_verify before insert on public.leads
  for each row execute function private.verify_form_submission();
create trigger contact_messages_0_verify before insert on public.contact_messages
  for each row execute function private.verify_form_submission();
create trigger newsletter_0_verify before insert on public.newsletter_subscribers
  for each row execute function private.verify_form_submission();

alter policy leads_insert_public on public.leads
  with check (status = 'new' and admin_notes is null and consent and ip_hash is not null and form_sig is not null);
alter policy contact_insert_public on public.contact_messages
  with check (status = 'new' and consent and ip_hash is not null and form_sig is not null);
alter policy newsletter_insert_public on public.newsletter_subscribers
  with check (status = 'pending' and ip_hash is not null and form_sig is not null);

-- Stricter e-mail format (no characters that alter a mailto: link).
alter table public.leads drop constraint leads_email_check,
  add constraint leads_email_check check (char_length(email) <= 254 and email ~ '^[^@\s?&%/<>"]+@[^@\s?&%/<>"]+\.[^@\s?&%/<>"]+$');
alter table public.contact_messages drop constraint contact_messages_email_check,
  add constraint contact_messages_email_check check (char_length(email) <= 254 and email ~ '^[^@\s?&%/<>"]+@[^@\s?&%/<>"]+\.[^@\s?&%/<>"]+$');
alter table public.newsletter_subscribers drop constraint newsletter_subscribers_email_check,
  add constraint newsletter_subscribers_email_check check (char_length(email) <= 254 and email = lower(email) and email ~ '^[^@\s?&%/<>"]+@[^@\s?&%/<>"]+\.[^@\s?&%/<>"]+$');

-- Rate-limit buckets: add mfa and ad_impression.
create or replace function public.consume_rate_limit(
  p_bucket text,
  p_key_hash text,
  p_max int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_hits int;
begin
  if p_bucket not in ('quote', 'contact', 'newsletter', 'login', 'mfa', 'ad_click', 'ad_impression')
     or p_key_hash !~ '^[0-9a-f]{64}$'
     or p_max not between 1 and 1000
     or p_window_seconds not between 10 and 86400 then
    raise exception 'invalid_rate_limit_args' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.blocked_entities b
    where b.entity_type = 'ip' and b.value = p_key_hash and b.lifted_at is null and b.expires_at > now()
  ) then
    return false;
  end if;

  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limits as r (bucket, key_hash, window_start, hits)
  values (p_bucket, p_key_hash, v_window, 1)
  on conflict (bucket, key_hash, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;

  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_max;
end;
$$;
revoke all on function public.consume_rate_limit(text, text, int, int) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, int, int) to service_role;

update public.detection_rules set threshold = 3, block_minutes = null where name = 'injection_pattern';
insert into public.detection_rules (name, event_type, threshold, window_seconds, severity, block_minutes, enabled)
values ('mfa_failures', 'mfa_failed', 5, 600, 'medium', 30, true)
on conflict (name) do nothing;
