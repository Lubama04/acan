-- Advertising (slots, campaigns, server-side events), SILS security tables, media bucket,
-- retention purge.

-- ---------------------------------------------------------------------------------------------
-- Ads
-- ---------------------------------------------------------------------------------------------
create table public.ad_slots (
  key text primary key check (key in ('header', 'in_article', 'sidebar', 'footer')),
  label text not null check (char_length(label) <= 80),
  width int not null check (width between 100 and 1200),
  height int not null check (height between 50 and 800),
  enabled boolean not null default true,
  adsense_slot_id text check (adsense_slot_id ~ '^[0-9]{6,20}$'),
  updated_at timestamptz not null default now()
);
create trigger ad_slots_touch before update on public.ad_slots
  for each row execute function private.touch_updated_at();

create table public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null references public.ad_slots (key) on update cascade,
  advertiser text not null check (char_length(advertiser) between 2 and 120),
  disclosure text not null default 'Publicité' check (disclosure in ('Publicité', 'Sponsorisé')),
  image_url text not null check (image_url ~ '^https://'),
  image_alt text not null check (char_length(image_alt) between 3 and 200),
  target_url text not null check (target_url ~ '^https://' and char_length(target_url) <= 500),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default false,
  max_impressions int check (max_impressions > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ad_campaigns_dates check (ends_at > starts_at)
);
create index ad_campaigns_slot_idx on public.ad_campaigns (slot_key, starts_at, ends_at) where active;
create trigger ad_campaigns_touch before update on public.ad_campaigns
  for each row execute function private.touch_updated_at();

-- Raw events are written by the server only (service role) after bot filtering and caps.
create table public.ad_events (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.ad_campaigns (id) on delete cascade,
  event_type text not null check (event_type in ('impression', 'click')),
  created_at timestamptz not null default now(),
  session_hash text check (session_hash ~ '^[0-9a-f]{64}$'),
  ip_hash text check (ip_hash ~ '^[0-9a-f]{64}$'),
  flagged boolean not null default false,
  flag_reason text check (flag_reason in ('bot', 'repeat_click', 'ip_cap', 'session_cap'))
);
create index ad_events_campaign_idx on public.ad_events (campaign_id, event_type, created_at desc);

alter table public.ad_slots enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.ad_events enable row level security;

create policy ad_slots_select on public.ad_slots for select to anon, authenticated using (true);
-- ^ slot geometry is public configuration (no personal data, needed to reserve space).
create policy ad_slots_update_admin on public.ad_slots for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy ad_campaigns_select on public.ad_campaigns for select to anon, authenticated
  using ((active and now() between starts_at and ends_at) or (select private.is_admin()));
create policy ad_campaigns_insert_admin on public.ad_campaigns for insert to authenticated
  with check ((select private.is_admin()));
create policy ad_campaigns_update_admin on public.ad_campaigns for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy ad_campaigns_delete_admin on public.ad_campaigns for delete to authenticated
  using ((select private.is_admin()));

create policy ad_events_select_admin on public.ad_events for select to authenticated
  using ((select private.is_admin()));

create trigger ad_slots_audit after update on public.ad_slots
  for each row execute function private.audit_admin_change();
create trigger ad_campaigns_audit after insert or update or delete on public.ad_campaigns
  for each row execute function private.audit_admin_change();

-- Aggregated stats for the back-office; security_invoker keeps the caller's RLS.
create view public.ad_campaign_stats with (security_invoker = true) as
select
  c.id as campaign_id,
  c.advertiser,
  c.slot_key,
  count(*) filter (where e.event_type = 'impression' and not e.flagged) as impressions,
  count(*) filter (where e.event_type = 'click' and not e.flagged) as clicks,
  count(*) filter (where e.flagged) as flagged_events
from public.ad_campaigns c
left join public.ad_events e on e.campaign_id = c.id
group by c.id, c.advertiser, c.slot_key;

-- ---------------------------------------------------------------------------------------------
-- SILS — detection, qualification, incidents, learning
-- ---------------------------------------------------------------------------------------------
create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null check (event_type in (
    'login_failed', 'login_succeeded', 'mfa_failed', 'access_denied', 'rate_limited',
    'suspicious_payload', 'honeypot_triggered', 'role_changed', 'admin_action', 'ad_fraud_suspected',
    'dependency_vulnerability', 'other')),
  severity text not null check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  user_id uuid,
  ip_hash text check (ip_hash ~ '^[0-9a-f]{64}$'),
  user_agent text check (char_length(user_agent) <= 300),
  endpoint text check (char_length(endpoint) <= 200),
  payload_summary jsonb not null default '{}'::jsonb,
  source text not null default 'web' check (char_length(source) <= 40)
);
comment on column public.security_events.ip_hash is 'Salted SHA-256 of the IP (data minimisation): never the raw IP.';
create index security_events_created_idx on public.security_events (created_at desc);
create index security_events_type_ip_idx on public.security_events (event_type, ip_hash, created_at desc);

create table public.detection_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) <= 80),
  event_type text not null,
  threshold int not null check (threshold between 1 and 10000),
  window_seconds int not null check (window_seconds between 10 and 86400),
  severity text not null check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  block_minutes int check (block_minutes between 15 and 1440),
  enabled boolean not null default false,
  proposed_by text not null default 'human' check (proposed_by in ('human', 'system')),
  updated_at timestamptz not null default now()
);
create trigger detection_rules_touch before update on public.detection_rules
  for each row execute function private.touch_updated_at();

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'ouvert' check (status in ('ouvert', 'contenu', 'en_analyse', 'corrige', 'clos')),
  severity text not null check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  title text not null check (char_length(title) <= 200),
  asset text check (char_length(asset) <= 200),
  vector text check (char_length(vector) <= 200),
  confidence text not null default 'faible' check (confidence in ('faible', 'moyen', 'eleve')),
  attribution_uncertain boolean not null default true,
  timeline jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  root_cause text check (char_length(root_cause) <= 4000),
  impact text check (char_length(impact) <= 4000),
  remediation_proposed text check (char_length(remediation_proposed) <= 8000),
  remediation_applied text check (char_length(remediation_applied) <= 8000),
  validated_by uuid references auth.users (id) on delete set null,
  closed_at timestamptz,
  updated_at timestamptz not null default now()
);
create trigger incidents_touch before update on public.incidents
  for each row execute function private.touch_updated_at();

create table public.security_memory (
  id uuid primary key default gen_random_uuid(),
  pattern_name text not null check (char_length(pattern_name) <= 120),
  attack_type text not null check (char_length(attack_type) <= 120),
  symptoms text check (char_length(symptoms) <= 4000),
  cause text check (char_length(cause) <= 4000),
  fix text check (char_length(fix) <= 4000),
  tests_to_add text check (char_length(tests_to_add) <= 4000),
  first_seen timestamptz not null default now(),
  occurrences int not null default 1 check (occurrences > 0),
  linked_incidents uuid[] not null default '{}'
);

alter table public.security_events enable row level security;
alter table public.detection_rules enable row level security;
alter table public.incidents enable row level security;
alter table public.security_memory enable row level security;

-- security_events: admin read only; insert via service role only; no update/delete (immutable).
create policy security_events_select_admin on public.security_events for select to authenticated
  using ((select private.is_admin()));

create policy detection_rules_select_admin on public.detection_rules for select to authenticated
  using ((select private.is_admin()));
create policy detection_rules_update_admin on public.detection_rules for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy incidents_select_admin on public.incidents for select to authenticated
  using ((select private.is_admin()));
create policy incidents_update_admin on public.incidents for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy security_memory_select_admin on public.security_memory for select to authenticated
  using ((select private.is_admin()));
create policy security_memory_insert_admin on public.security_memory for insert to authenticated
  with check ((select private.is_admin()));
create policy security_memory_update_admin on public.security_memory for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create trigger detection_rules_audit after update on public.detection_rules
  for each row execute function private.audit_admin_change();
create trigger incidents_audit after update on public.incidents
  for each row execute function private.audit_admin_change();
create trigger user_roles_audit after insert or update or delete on public.user_roles
  for each row execute function private.audit_admin_change();

-- Default rules (SILS phase 3). Enabled because they come from the approved specification.
insert into public.detection_rules (name, event_type, threshold, window_seconds, severity, block_minutes, enabled) values
  ('login_failures_medium', 'login_failed', 5, 600, 'medium', 15, true),
  ('login_failures_high', 'login_failed', 20, 600, 'high', 240, true),
  ('injection_pattern', 'suspicious_payload', 1, 600, 'high', 60, true),
  ('form_flood', 'rate_limited', 10, 600, 'medium', 30, true),
  ('ad_click_fraud', 'ad_fraud_suspected', 10, 3600, 'medium', 60, true);

-- ---------------------------------------------------------------------------------------------
-- Media bucket: public read (site images), editors upload. Images only, 5 MB max.
-- ---------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/avif', 'image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy media_insert_editor on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select private.is_editor()));
create policy media_update_editor on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select private.is_editor()))
  with check (bucket_id = 'media' and (select private.is_editor()));
create policy media_delete_admin on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select private.is_admin()));
-- No SELECT policy on storage.objects: public URLs of the public bucket work without listing,
-- and anonymous clients cannot enumerate files.

-- ---------------------------------------------------------------------------------------------
-- Retention (documented in the privacy policy)
-- ---------------------------------------------------------------------------------------------
create or replace function private.purge_expired_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.leads where created_at < now() - interval '24 months' and status in ('lost', 'archived', 'new');
  delete from public.contact_messages where created_at < now() - interval '12 months';
  delete from public.newsletter_subscribers where status = 'unsubscribed' and created_at < now() - interval '1 month';
  delete from public.newsletter_subscribers where status = 'pending' and created_at < now() - interval '30 days';
  delete from public.ad_events where created_at < now() - interval '13 months';
  delete from public.rate_limits where window_start < now() - interval '1 day';
  delete from public.blocked_entities where lifted_at is not null and lifted_at < now() - interval '6 months';
end;
$$;
revoke all on function private.purge_expired_data() from public;

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
select cron.schedule('purge-expired-data', '15 3 * * *', $$select private.purge_expired_data()$$);
