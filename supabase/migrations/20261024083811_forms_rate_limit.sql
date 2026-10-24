-- Public forms: quote requests (leads), contact messages, newsletter.
-- Anonymous visitors may INSERT only (no read-back). Admins (MFA) read and process.
-- Defence in depth: CHECK constraints, policy WITH CHECK, global throttle trigger,
-- per-IP rate limit function (keyed on a salted hash computed server-side; raw IPs are never stored).

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  organization text check (char_length(organization) <= 160),
  email text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone ~ '^\+?[0-9 ()-]{6,20}$'),
  segment text not null check (segment in
    ('institution', 'ong', 'entreprise', 'education-sante', 'entrepreneur', 'association', 'autre')),
  services text[] not null check (cardinality(services) between 1 and 6),
  package_slug text check (char_length(package_slug) <= 80),
  budget_range text check (budget_range in ('non-defini', 'moins-500k', '500k-1m', '1m-3m', 'plus-3m')),
  timeline text check (timeline in ('urgent', '1-mois', '1-3-mois', 'plus-3-mois', 'non-defini')),
  location text check (location in ('ndjamena', 'province', 'diaspora', 'autre')),
  message text not null check (char_length(message) between 20 and 4000),
  consent boolean not null check (consent),
  status text not null default 'new' check (status in ('new', 'in_progress', 'quoted', 'won', 'lost', 'archived')),
  admin_notes text check (char_length(admin_notes) <= 4000),
  ip_hash text check (ip_hash ~ '^[0-9a-f]{64}$'),
  updated_at timestamptz not null default now()
);
create index leads_created_at_idx on public.leads (created_at desc);
create trigger leads_touch before update on public.leads
  for each row execute function private.touch_updated_at();

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone ~ '^\+?[0-9 ()-]{6,20}$'),
  topic text not null check (topic in ('question', 'partenariat', 'publicite', 'presse', 'donnees-personnelles', 'autre')),
  message text not null check (char_length(message) between 10 and 4000),
  consent boolean not null check (consent),
  status text not null default 'new' check (status in ('new', 'answered', 'archived')),
  ip_hash text check (ip_hash ~ '^[0-9a-f]{64}$'),
  updated_at timestamptz not null default now()
);
create index contact_messages_created_at_idx on public.contact_messages (created_at desc);
create trigger contact_messages_touch before update on public.contact_messages
  for each row execute function private.touch_updated_at();

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) <= 254 and email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  consent_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'active', 'unsubscribed')),
  unsubscribe_token uuid not null default gen_random_uuid(),
  ip_hash text check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Anonymous/authenticated visitors: insert only, with server-controlled fields pinned.
create policy leads_insert_public on public.leads
  for insert to anon, authenticated
  with check (status = 'new' and admin_notes is null and consent);
create policy contact_insert_public on public.contact_messages
  for insert to anon, authenticated
  with check (status = 'new' and consent);
create policy newsletter_insert_public on public.newsletter_subscribers
  for insert to anon, authenticated
  with check (status = 'pending');

-- Admins only (MFA) for reading and processing personal data. Deletion = right to erasure.
create policy leads_select_admin on public.leads for select to authenticated using ((select private.is_admin()));
create policy leads_update_admin on public.leads for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy leads_delete_admin on public.leads for delete to authenticated using ((select private.is_admin()));
create policy contact_select_admin on public.contact_messages for select to authenticated using ((select private.is_admin()));
create policy contact_update_admin on public.contact_messages for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy contact_delete_admin on public.contact_messages for delete to authenticated using ((select private.is_admin()));
create policy newsletter_select_admin on public.newsletter_subscribers for select to authenticated using ((select private.is_admin()));
create policy newsletter_update_admin on public.newsletter_subscribers for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy newsletter_delete_admin on public.newsletter_subscribers for delete to authenticated using ((select private.is_admin()));

create trigger leads_audit after update or delete on public.leads
  for each row execute function private.audit_admin_change();
create trigger contact_messages_audit after update or delete on public.contact_messages
  for each row execute function private.audit_admin_change();
create trigger newsletter_audit after update or delete on public.newsletter_subscribers
  for each row execute function private.audit_admin_change();

-- ---------------------------------------------------------------------------------------------
-- Global throttle: caps abuse that would bypass the website and hit the Data API directly.
-- ---------------------------------------------------------------------------------------------
create or replace function private.throttle_public_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent int;
begin
  execute format('select count(*) from public.%I where created_at > now() - interval ''10 minutes''', tg_table_name)
    into v_recent;
  if v_recent >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function private.throttle_public_insert() from public;

create trigger leads_throttle before insert on public.leads
  for each row execute function private.throttle_public_insert();
create trigger contact_messages_throttle before insert on public.contact_messages
  for each row execute function private.throttle_public_insert();
create trigger newsletter_throttle before insert on public.newsletter_subscribers
  for each row execute function private.throttle_public_insert();

-- ---------------------------------------------------------------------------------------------
-- Blocked entities (SILS phase 4): always temporary unless a human lifts/extends it.
-- ---------------------------------------------------------------------------------------------
create table public.blocked_entities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('ip', 'user', 'session')),
  value text not null check (char_length(value) <= 128),
  reason text not null check (char_length(reason) <= 300),
  incident_id uuid,
  expires_at timestamptz not null,
  created_by text not null default 'system' check (char_length(created_by) <= 80),
  created_at timestamptz not null default now(),
  lifted_at timestamptz,
  lifted_by uuid references auth.users (id) on delete set null,
  constraint blocked_entities_temporary check (expires_at <= created_at + interval '7 days')
);
create index blocked_entities_lookup_idx on public.blocked_entities (entity_type, value) where lifted_at is null;
alter table public.blocked_entities enable row level security;
create policy blocked_select_admin on public.blocked_entities for select to authenticated using ((select private.is_admin()));
-- Admin can only lift a block (set lifted_at/lifted_by); creation comes from the server (service role).
create policy blocked_update_admin on public.blocked_entities for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()) and lifted_by = (select auth.uid()));
create trigger blocked_entities_audit after insert or update or delete on public.blocked_entities
  for each row execute function private.audit_admin_change();

-- ---------------------------------------------------------------------------------------------
-- Rate limiting buckets (fixed window). Called by the website server with a salted IP hash.
-- ---------------------------------------------------------------------------------------------
create table public.rate_limits (
  bucket text not null,
  key_hash text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (bucket, key_hash, window_start)
);
alter table public.rate_limits enable row level security;
-- No policies: only reachable through consume_rate_limit().

-- SECURITY DEFINER is required: callers have no table privileges. Inputs are strictly validated,
-- buckets are a closed list, and stale rows are purged opportunistically.
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
  if p_bucket not in ('quote', 'contact', 'newsletter', 'login', 'ad_click')
     or p_key_hash !~ '^[0-9a-f]{64}$'
     or p_max not between 1 and 200
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
revoke all on function public.consume_rate_limit(text, text, int, int) from public;
grant execute on function public.consume_rate_limit(text, text, int, int) to anon, authenticated, service_role;
