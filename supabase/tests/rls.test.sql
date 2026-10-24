-- RLS regression tests. Run inside a transaction that is always rolled back:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls.test.sql
-- (or paste into the Supabase SQL editor). Any failed assertion raises an exception.
-- Each assertion would fail if the corresponding policy were removed or loosened.

begin;

-- ---------- Fixtures (as table owner) ----------
insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-4000-8000-0000000000a1', 'admin-test@example.org', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b2', 'user-test@example.org', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000c3', 'not-allowlisted@example.org', 'authenticated', 'authenticated');

insert into public.admin_allowlist (email) values ('admin-test@example.org');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'admin'),
  ('00000000-0000-4000-8000-0000000000c3', 'admin'); -- role without allowlist: must NOT be admin

insert into public.posts (slug, title, excerpt, body_md, status, published_at) values
  ('rls-test-draft', 'Brouillon de test', 'Extrait de test suffisamment long.', 'Corps', 'draft', null),
  ('rls-test-published', 'Article publié de test', 'Extrait de test suffisamment long.', 'Corps', 'published', now() - interval '1 hour');

insert into public.leads (full_name, email, segment, services, message, consent, ip_hash)
values ('Test Lead', 'lead@example.org', 'ong', array['relations-presse'], 'Message de test assez long pour passer.', true, repeat('a', 64));

insert into public.security_events (event_type, severity) values ('other', 'info');

-- ---------- Structural: no table without RLS ----------
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity) then
    raise exception 'FAIL: a public table has RLS disabled';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and cmd in ('UPDATE', 'ALL') and with_check is null) then
    raise exception 'FAIL: an UPDATE policy lacks WITH CHECK';
  end if;
end $$;

-- ---------- Anonymous visitor ----------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
begin
  if exists (select 1 from public.posts where slug = 'rls-test-draft') then raise exception 'FAIL anon: sees draft post'; end if;
  if not exists (select 1 from public.posts where slug = 'rls-test-published') then raise exception 'FAIL anon: cannot see published post'; end if;
  if exists (select 1 from public.leads) then raise exception 'FAIL anon: reads leads'; end if;
  if exists (select 1 from public.security_events) then raise exception 'FAIL anon: reads security_events'; end if;
  if exists (select 1 from public.site_settings where not is_public) then raise exception 'FAIL anon: reads private settings'; end if;

  -- Insert-only forms: a valid lead is accepted …
  insert into public.leads (full_name, email, segment, services, message, consent, ip_hash)
  values ('Visiteur', 'v@example.org', 'entreprise', array['gestion-reseaux-sociaux'], 'Bonjour, nous voudrions un devis.', true, repeat('b', 64));

  -- … but forging server-controlled fields is rejected.
  begin
    insert into public.leads (full_name, email, segment, services, message, consent, ip_hash, status)
    values ('Visiteur', 'v@example.org', 'entreprise', array['x'], 'Bonjour, nous voudrions un devis.', true, repeat('c', 64), 'won');
    raise exception 'FAIL anon: could set lead status';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.leads (full_name, email, segment, services, message, consent)
    values ('Visiteur', 'v@example.org', 'entreprise', array['x'], 'Bonjour, nous voudrions un devis.', true);
    raise exception 'FAIL anon: lead without ip_hash accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.posts set title = 'piraté' where slug = 'rls-test-published';
    if found then raise exception 'FAIL anon: updated a post'; end if;
  end;
  begin
    insert into public.posts (slug, title, excerpt, body_md) values ('x-anon', 'Titre anon', 'Extrait de test suffisamment long.', 'x');
    raise exception 'FAIL anon: inserted a post';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.consume_rate_limit('quote', repeat('d', 64), 5, 60);
    raise exception 'FAIL anon: can call consume_rate_limit';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- ---------- Signed-in user without role ----------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-4000-8000-0000000000b2","email":"user-test@example.org","aal":"aal2"}', true);
do $$
begin
  if exists (select 1 from public.leads) then raise exception 'FAIL user: reads leads'; end if;
  if exists (select 1 from public.posts where slug = 'rls-test-draft') then raise exception 'FAIL user: sees draft'; end if;
  if exists (select 1 from public.admin_audit_log) then raise exception 'FAIL user: reads audit log'; end if;
  begin
    insert into public.user_roles (user_id, role) values ('00000000-0000-4000-8000-0000000000b2', 'admin');
    raise exception 'FAIL user: self-granted admin';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- ---------- Admin role but email not allowlisted ----------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-4000-8000-0000000000c3","email":"not-allowlisted@example.org","aal":"aal2"}', true);
do $$
begin
  if exists (select 1 from public.leads) then raise exception 'FAIL: non-allowlisted admin reads leads'; end if;
end $$;
reset role;

-- ---------- Allowlisted admin WITHOUT MFA (aal1) ----------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-4000-8000-0000000000a1","email":"admin-test@example.org","aal":"aal1"}', true);
do $$
begin
  if exists (select 1 from public.leads) then raise exception 'FAIL: admin without MFA reads leads'; end if;
end $$;
reset role;

-- ---------- Allowlisted admin WITH MFA (aal2) ----------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-4000-8000-0000000000a1","email":"admin-test@example.org","aal":"aal2"}', true);
do $$
begin
  if not exists (select 1 from public.leads) then raise exception 'FAIL admin: cannot read leads'; end if;
  if not exists (select 1 from public.posts where slug = 'rls-test-draft') then raise exception 'FAIL admin: cannot see drafts'; end if;
  if not exists (select 1 from public.security_events) then raise exception 'FAIL admin: cannot read security_events'; end if;
  update public.leads set status = 'in_progress' where email = 'lead@example.org';
  if not found then raise exception 'FAIL admin: cannot update lead'; end if;
  -- Immutable journal: even an admin cannot alter security events or the audit log.
  update public.security_events set severity = 'critical';
  if found then raise exception 'FAIL admin: altered security_events'; end if;
  delete from public.admin_audit_log;
  if found then raise exception 'FAIL admin: deleted audit log rows'; end if;
  if not exists (select 1 from public.admin_audit_log where table_name = 'leads' and action = 'UPDATE') then
    raise exception 'FAIL: admin update was not audited';
  end if;
end $$;
reset role;

select 'ALL RLS TESTS PASSED' as result;
rollback;
