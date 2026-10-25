-- Foundation: private helper schema, admin roles (SILS: separate user_roles table), allowlist,
-- immutable admin audit log, updated_at trigger.

create schema if not exists private;
revoke all on schema private from public;
-- Policies evaluate helper functions with the caller's role, so API roles need USAGE.
-- The schema is NOT exposed through the Data API, so nothing in it is callable over HTTP.
grant usage on schema private to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- Roles and allowlist
-- ---------------------------------------------------------------------------------------------
create table public.admin_allowlist (
  email text primary key check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);
comment on table public.admin_allowlist is 'Emails allowed to hold an admin role. Managed by the owner only (SQL / service role).';

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'editor')),
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users (id) on delete set null,
  primary key (user_id, role)
);
comment on table public.user_roles is 'Role assignments (never stored on profiles). Granted by the owner via SQL.';

-- has_role: SECURITY DEFINER is required to read user_roles/admin_allowlist regardless of the
-- caller's RLS; search_path is pinned and the function lives in the non-exposed private schema.
create or replace function private.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.admin_allowlist al on al.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    where ur.user_id = auth.uid()
      and ur.role = p_role
  )
$$;

-- Admin = role + allowlisted email + MFA session (aal2). Editors get the same content rights
-- but no access to leads, ads or security data.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('admin') and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
$$;

create or replace function private.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (private.has_role('admin') or private.has_role('editor'))
    and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
$$;

revoke all on function private.has_role(text), private.is_admin(), private.is_editor() from public;
grant execute on function private.has_role(text), private.is_admin(), private.is_editor()
  to anon, authenticated, service_role;

alter table public.admin_allowlist enable row level security;
alter table public.user_roles enable row level security;

-- Admins can see who holds a role; nobody can change roles through the API.
create policy admin_allowlist_select_admin on public.admin_allowlist
  for select to authenticated using ((select private.is_admin()));
create policy user_roles_select_self_or_admin on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- ---------------------------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------------------------
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Immutable audit log of admin actions (SILS: every admin action journaled)
-- ---------------------------------------------------------------------------------------------
create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_id uuid,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  table_name text not null,
  record_id text,
  changed_fields text[]
);
create index admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);
alter table public.admin_audit_log enable row level security;
create policy admin_audit_log_select_admin on public.admin_audit_log
  for select to authenticated using ((select private.is_admin()));
-- No insert/update/delete policies: rows only come from the trigger below (immutable log).

create or replace function private.audit_admin_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id text;
  v_fields text[];
begin
  if tg_op = 'DELETE' then
    v_id := coalesce(to_jsonb(old) ->> 'id', to_jsonb(old) ->> 'key');
  else
    v_id := coalesce(to_jsonb(new) ->> 'id', to_jsonb(new) ->> 'key');
  end if;
  if tg_op = 'UPDATE' then
    -- Field names only: values may contain personal data.
    select array_agg(n.key order by n.key) into v_fields
    from jsonb_each(to_jsonb(new)) n
    join jsonb_each(to_jsonb(old)) o using (key)
    where n.value is distinct from o.value and n.key <> 'updated_at';
  end if;
  insert into public.admin_audit_log (actor_id, action, table_name, record_id, changed_fields)
  values (auth.uid(), tg_op, tg_table_name, v_id, v_fields);
  return coalesce(new, old);
end;
$$;
revoke all on function private.audit_admin_change() from public;
