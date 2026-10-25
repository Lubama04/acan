-- Public content: site settings, services, packages, segments, team, case studies, posts.
-- Public can read published rows only; editors/admins (MFA) manage content.

-- ---------------------------------------------------------------------------------------------
-- site_settings (key/value). Legal identifiers stay empty until provided by the owner:
-- the site then shows « en cours d'immatriculation ».
-- ---------------------------------------------------------------------------------------------
create table public.site_settings (
  key text primary key check (key ~ '^[a-z][a-z0-9_]{1,62}$'),
  value jsonb not null default 'null'::jsonb,
  is_public boolean not null default true,
  description text check (char_length(description) <= 300),
  updated_at timestamptz not null default now()
);
create trigger site_settings_touch before update on public.site_settings
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 3 and 120),
  summary text not null check (char_length(summary) between 10 and 400),
  body_md text not null default '' check (char_length(body_md) <= 20000),
  deliverables text[] not null default '{}',
  process text[] not null default '{}',
  position smallint not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger services_touch before update on public.services
  for each row execute function private.touch_updated_at();

-- Monthly packages: structure only, prices default to « Sur devis » (never invented).
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 3 and 80),
  audience text not null check (char_length(audience) <= 200),
  includes text[] not null default '{}',
  price_label text not null default 'Sur devis' check (char_length(price_label) <= 60),
  position smallint not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger packages_touch before update on public.packages
  for each row execute function private.touch_updated_at();

create table public.segments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 120),
  summary text not null check (char_length(summary) <= 400),
  needs text[] not null default '{}',
  approach text not null default '' check (char_length(approach) <= 2000),
  key_message text not null default '' check (char_length(key_message) <= 200),
  position smallint not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger segments_touch before update on public.segments
  for each row execute function private.touch_updated_at();

-- Team: hidden until real CVs are provided (published defaults to false).
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  role text not null check (char_length(role) between 2 and 120),
  bio text not null default '' check (char_length(bio) <= 3000),
  experience text[] not null default '{}',
  photo_url text check (photo_url ~ '^https://'),
  photo_alt text check (char_length(photo_alt) <= 200),
  position smallint not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger team_members_touch before update on public.team_members
  for each row execute function private.touch_updated_at();

-- Case studies: cannot be published without the client's documented consent.
create table public.case_studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  client_name text not null check (char_length(client_name) between 2 and 160),
  title text not null check (char_length(title) between 3 and 160),
  summary text not null check (char_length(summary) <= 500),
  challenge text not null default '' check (char_length(challenge) <= 5000),
  work_done text not null default '' check (char_length(work_done) <= 5000),
  results text not null default '' check (char_length(results) <= 5000),
  client_consent_ref text check (char_length(client_consent_ref) <= 200),
  published boolean not null default false,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint case_studies_consent_required check (not published or client_consent_ref is not null)
);
create trigger case_studies_touch before update on public.case_studies
  for each row execute function private.touch_updated_at();

-- Journal posts (Markdown). Sponsored posts must name the sponsor.
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title text not null check (char_length(title) between 5 and 160),
  excerpt text not null check (char_length(excerpt) between 20 and 320),
  body_md text not null check (char_length(body_md) <= 100000),
  category text not null default 'conseils'
    check (category in ('conseils', 'etudes-de-cas', 'actualites-agence', 'ressources')),
  cover_url text check (cover_url ~ '^https://'),
  cover_alt text check (char_length(cover_alt) <= 200),
  author_name text not null default 'Africa Média' check (char_length(author_name) <= 120),
  sponsored boolean not null default false,
  sponsor_name text check (char_length(sponsor_name) <= 120),
  seo_title text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_sponsor_named check (not sponsored or sponsor_name is not null),
  constraint posts_published_date check (status = 'draft' or published_at is not null)
);
create index posts_published_idx on public.posts (published_at desc) where status = 'published';
create trigger posts_touch before update on public.posts
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------------------------
alter table public.site_settings enable row level security;
alter table public.services enable row level security;
alter table public.packages enable row level security;
alter table public.segments enable row level security;
alter table public.team_members enable row level security;
alter table public.case_studies enable row level security;
alter table public.posts enable row level security;

-- site_settings: public keys readable by all; admin manages.
create policy site_settings_select on public.site_settings
  for select to anon, authenticated using (is_public or (select private.is_admin()));
create policy site_settings_insert_admin on public.site_settings
  for insert to authenticated with check ((select private.is_admin()));
create policy site_settings_update_admin on public.site_settings
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- Generic content: published rows public, editors manage everything.
do $$
declare t text;
begin
  foreach t in array array['services', 'packages', 'segments', 'team_members', 'case_studies'] loop
    execute format(
      'create policy %1$s_select on public.%1$I for select to anon, authenticated using (published or (select private.is_editor()))', t);
    execute format(
      'create policy %1$s_insert_editor on public.%1$I for insert to authenticated with check ((select private.is_editor()))', t);
    execute format(
      'create policy %1$s_update_editor on public.%1$I for update to authenticated using ((select private.is_editor())) with check ((select private.is_editor()))', t);
    execute format(
      'create policy %1$s_delete_admin on public.%1$I for delete to authenticated using ((select private.is_admin()))', t);
    execute format(
      'create trigger %1$s_audit after insert or update or delete on public.%1$I for each row execute function private.audit_admin_change()', t);
  end loop;
end $$;

create policy posts_select on public.posts
  for select to anon, authenticated
  using ((status = 'published' and published_at <= now()) or (select private.is_editor()));
create policy posts_insert_editor on public.posts
  for insert to authenticated with check ((select private.is_editor()));
create policy posts_update_editor on public.posts
  for update to authenticated using ((select private.is_editor())) with check ((select private.is_editor()));
create policy posts_delete_admin on public.posts
  for delete to authenticated using ((select private.is_admin()));
create trigger posts_audit after insert or update or delete on public.posts
  for each row execute function private.audit_admin_change();
create trigger site_settings_audit after insert or update or delete on public.site_settings
  for each row execute function private.audit_admin_change();
