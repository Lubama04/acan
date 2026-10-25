-- Advisor fixes (lints 0028/0029, 0001).
-- 1. consume_rate_limit is no longer callable by anon/authenticated: only the server (service role).
-- 2. Per-IP limits for public forms move into the insert trigger, keyed on the row's ip_hash,
--    so they apply whatever the entry point. ip_hash becomes mandatory on public inserts.
-- 3. Covering indexes for foreign keys.

revoke execute on function public.consume_rate_limit(text, text, int, int) from anon, authenticated;

create or replace function private.throttle_public_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent int;
  v_per_ip int;
  v_ip text := to_jsonb(new) ->> 'ip_hash';
  v_ip_max int := case tg_table_name when 'newsletter_subscribers' then 3 else 5 end;
begin
  -- Temporary blocks decided by the detection rules.
  if v_ip is not null and exists (
    select 1 from public.blocked_entities b
    where b.entity_type = 'ip' and b.value = v_ip and b.lifted_at is null and b.expires_at > now()
  ) then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  execute format(
    'select count(*), count(*) filter (where ip_hash = $1) from public.%I where created_at > now() - interval ''10 minutes''',
    tg_table_name)
    into v_recent, v_per_ip using v_ip;

  if v_recent >= 60 or v_per_ip >= v_ip_max then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function private.throttle_public_insert() from public;

alter policy leads_insert_public on public.leads
  with check (status = 'new' and admin_notes is null and consent and ip_hash is not null);
alter policy contact_insert_public on public.contact_messages
  with check (status = 'new' and consent and ip_hash is not null);
alter policy newsletter_insert_public on public.newsletter_subscribers
  with check (status = 'pending' and ip_hash is not null);

create index if not exists leads_ip_recent_idx on public.leads (ip_hash, created_at desc);
create index if not exists contact_ip_recent_idx on public.contact_messages (ip_hash, created_at desc);
create index if not exists newsletter_ip_recent_idx on public.newsletter_subscribers (ip_hash, created_at desc);

create index if not exists blocked_entities_lifted_by_idx on public.blocked_entities (lifted_by);
create index if not exists incidents_validated_by_idx on public.incidents (validated_by);
create index if not exists user_roles_granted_by_idx on public.user_roles (granted_by);

comment on table public.rate_limits is 'Fixed-window counters. No RLS policy on purpose: only public.consume_rate_limit (service role) touches it.';
